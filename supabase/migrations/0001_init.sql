create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  phone text unique,
  username text unique not null,
  full_name text,
  avatar_url text,
  about text,
  is_private boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  language text not null default 'ru',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create table if not exists public.user_privacy (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  show_last_seen boolean not null default true,
  allow_calls_from text not null default 'everyone' check (allow_calls_from in ('everyone', 'contacts', 'nobody')),
  allow_messages_from text not null default 'everyone' check (allow_messages_from in ('everyone', 'contacts', 'nobody')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_privacy_updated_at
before update on public.user_privacy
for each row execute function public.set_updated_at();

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  title text,
  avatar_url text,
  is_group boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_chats_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  last_read_message_id uuid,
  primary key (chat_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'voice')),
  content text not null default '',
  voice_url text,
  duration_sec integer,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_chat_created_at on public.messages (chat_id, created_at desc);

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  channel_name text not null,
  call_kind text not null check (call_kind in ('audio', 'video')),
  status text not null default 'ringing' check (status in ('ringing', 'active', 'ended', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'offline' check (status in ('online', 'away', 'offline')),
  last_seen_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), replace(new.phone, '+', 'user_'));

  insert into public.profiles (id, email, phone, username, full_name, avatar_url, about, is_private, last_seen_at)
  values (new.id, new.email, new.phone, generated_username, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', '', false, now())
  on conflict (id) do update
    set email = excluded.email,
        phone = excluded.phone,
        updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_privacy (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_presence (user_id, status, last_seen_at)
  values (new.id, 'online', now())
  on conflict (user_id) do update set status = excluded.status, last_seen_at = excluded.last_seen_at;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_privacy enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.call_sessions enable row level security;
alter table public.user_presence enable row level security;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "user_settings_manage_self"
on public.user_settings
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_privacy_manage_self"
on public.user_privacy
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chats_select_member"
on public.chats
for select
to authenticated
using (
  exists (
    select 1 from public.chat_members cm
    where cm.chat_id = chats.id and cm.user_id = auth.uid()
  )
);

create policy "chats_insert_authenticated"
on public.chats
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "chats_update_owner_or_admin"
on public.chats
for update
to authenticated
using (
  exists (
    select 1 from public.chat_members cm
    where cm.chat_id = chats.id and cm.user_id = auth.uid() and cm.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.chat_members cm
    where cm.chat_id = chats.id and cm.user_id = auth.uid() and cm.role in ('owner', 'admin')
  )
);

create policy "chat_members_select_member"
on public.chat_members
for select
to authenticated
using (
  exists (
    select 1 from public.chat_members cm
    where cm.chat_id = chat_members.chat_id and cm.user_id = auth.uid()
  )
);

create policy "chat_members_insert_owner_admin"
on public.chat_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.chat_members cm
    where cm.chat_id = chat_members.chat_id and cm.user_id = auth.uid() and cm.role in ('owner', 'admin')
  )
  or auth.uid() = user_id
);

create policy "messages_select_member"
on public.messages
for select
to authenticated
using (
  exists (
    select 1 from public.chat_members cm
    where cm.chat_id = messages.chat_id and cm.user_id = auth.uid()
  )
);

create policy "messages_insert_member_sender"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_members cm
    where cm.chat_id = messages.chat_id and cm.user_id = auth.uid()
  )
);

create policy "messages_update_sender"
on public.messages
for update
to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

create policy "message_reads_manage_member"
on public.message_reads
for all
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.messages m
    join public.chat_members cm on cm.chat_id = m.chat_id
    where m.id = message_reads.message_id and cm.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.messages m
    join public.chat_members cm on cm.chat_id = m.chat_id
    where m.id = message_reads.message_id and cm.user_id = auth.uid()
  )
);

create policy "call_sessions_select_member"
on public.call_sessions
for select
to authenticated
using (
  exists (
    select 1 from public.chat_members cm
    where cm.chat_id = call_sessions.chat_id and cm.user_id = auth.uid()
  )
);

create policy "call_sessions_insert_member"
on public.call_sessions
for insert
to authenticated
with check (
  caller_id = auth.uid()
  and exists (
    select 1 from public.chat_members cm
    where cm.chat_id = call_sessions.chat_id and cm.user_id = auth.uid()
  )
);

create policy "user_presence_select_authenticated"
on public.user_presence
for select
to authenticated
using (true);

create policy "user_presence_manage_self"
on public.user_presence
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', false)
on conflict (id) do nothing;

create policy "avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy "avatars_manage_own"
on storage.objects
for all
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "voice_messages_manage_member"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'voice-messages'
  and exists (
    select 1
    from public.chat_members cm
    where cm.chat_id::text = (storage.foldername(name))[1] and cm.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'voice-messages'
  and exists (
    select 1
    from public.chat_members cm
    where cm.chat_id::text = (storage.foldername(name))[1] and cm.user_id = auth.uid()
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_members'
  ) then
    alter publication supabase_realtime add table public.chat_members;
  end if;
end;
$$;

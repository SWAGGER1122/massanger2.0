alter table if exists public.chats
add column if not exists is_archived boolean not null default false;

alter table if exists public.user_settings
add column if not exists show_phone_to text not null default 'contacts' check (show_phone_to in ('everyone', 'contacts', 'nobody'));

alter table if exists public.user_settings
add column if not exists show_online_to text not null default 'everyone' check (show_online_to in ('everyone', 'contacts', 'nobody'));

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_public_read'
  ) then
    create policy "media_public_read"
    on storage.objects
    for select
    to public
    using (bucket_id = 'media');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_upload_authenticated'
  ) then
    create policy "media_upload_authenticated"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'media');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_update_own'
  ) then
    create policy "media_update_own"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'media' and owner = auth.uid())
    with check (bucket_id = 'media' and owner = auth.uid());
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_delete_own'
  ) then
    create policy "media_delete_own"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'media' and owner = auth.uid());
  end if;
end;
$$;

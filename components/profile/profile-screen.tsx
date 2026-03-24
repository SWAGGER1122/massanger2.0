"use client";

import { motion } from "framer-motion";
import { Camera, Save } from "lucide-react";
import { useRef, useState } from "react";
import { ProfilePanel } from "@/components/profile/profile-panel";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useChat } from "@/hooks/use-chat";
import { useProfileSettings } from "@/hooks/use-profile-settings";
import { useTheme } from "@/hooks/use-theme";

export function ProfileScreen() {
  const chatState = useChat();
  const { theme, setTheme } = useTheme();
  const { session } = useAuthSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const profile = useProfileSettings(session?.user.id ?? null);

  return (
    <div className="grid h-full grid-cols-[360px_1fr] gap-4">
      <ProfilePanel
        chatState={chatState}
        theme={theme}
        onThemeChange={(nextTheme) => {
          setTheme(nextTheme);
        }}
      />

      <div className="space-y-3">
        <button
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
        >
          {settingsOpen ? "Скрыть настройки" : "Открыть настройки"}
        </button>

        {settingsOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/15 bg-slate-900/60 p-4 backdrop-blur-md"
          >
            <h1 className="text-lg font-semibold">Настройки</h1>
            <p className="mt-1 text-sm text-zinc-400">Редактирование bio, приватности и аватара</p>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative h-20 w-20 overflow-hidden rounded-full border border-white/20 bg-white/5"
              >
                {profile.state.avatarUrl ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${profile.state.avatarUrl}')`
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400/40 to-violet-500/40 text-white">
                    <Camera size={18} />
                  </div>
                )}
              </button>
              <div>
                <p className="text-sm text-zinc-100">{profile.uploadingAvatar ? "Загрузка..." : "Нажмите на аватар для смены"}</p>
                <p className="text-xs text-zinc-500">Моментальная загрузка в Supabase Storage</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void profile.uploadAvatar(file);
                  }
                }}
              />
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={profile.state.fullName}
                onChange={(event) => profile.setState((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Имя"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
              <textarea
                value={profile.state.about}
                onChange={(event) => profile.setState((prev) => ({ ...prev, about: event.target.value }))}
                placeholder="О себе"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="mb-1 text-xs text-zinc-400">Кто видит мой номер</p>
                <select
                  value={profile.state.showPhoneTo}
                  onChange={(event) =>
                    profile.setState((prev) => ({
                      ...prev,
                      showPhoneTo: event.target.value as "everyone" | "contacts" | "nobody"
                    }))
                  }
                  className="w-full rounded-xl bg-white/10 px-2 py-1 text-sm outline-none"
                >
                  <option value="everyone">Все</option>
                  <option value="contacts">Контакты</option>
                  <option value="nobody">Никто</option>
                </select>
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="mb-1 text-xs text-zinc-400">Кто видит мой онлайн</p>
                <select
                  value={profile.state.showOnlineTo}
                  onChange={(event) =>
                    profile.setState((prev) => ({
                      ...prev,
                      showOnlineTo: event.target.value as "everyone" | "contacts" | "nobody"
                    }))
                  }
                  className="w-full rounded-xl bg-white/10 px-2 py-1 text-sm outline-none"
                >
                  <option value="everyone">Все</option>
                  <option value="contacts">Контакты</option>
                  <option value="nobody">Никто</option>
                </select>
              </label>
            </div>

            <button
              onClick={() => {
                void profile.saveSettings();
              }}
              className="mt-4 flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
            >
              <Save size={16} />
              {profile.saving ? "Сохранение..." : "Сохранить"}
            </button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

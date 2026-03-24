"use client";

import { useEffect, useState } from "react";
import { hasSupabaseEnv, supabaseClient } from "@/lib/supabase/client";

type Visibility = "everyone" | "contacts" | "nobody";

interface ProfileSettingsState {
  fullName: string;
  about: string;
  avatarUrl: string;
  showPhoneTo: Visibility;
  showOnlineTo: Visibility;
}

const initialState: ProfileSettingsState = {
  fullName: "",
  about: "",
  avatarUrl: "",
  showPhoneTo: "contacts",
  showOnlineTo: "everyone"
};

export function useProfileSettings(userId: string | null) {
  const [state, setState] = useState<ProfileSettingsState>(initialState);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!userId || !supabaseClient || !hasSupabaseEnv) {
      return;
    }

    void supabaseClient
      .from("profiles")
      .select("full_name, about, avatar_url, username")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          return;
        }
        setUsername(data.username ?? "");
        setState((prev) => ({
          ...prev,
          fullName: data.full_name ?? "",
          about: data.about ?? "",
          avatarUrl: data.avatar_url ?? ""
        }));
      });

    void supabaseClient.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUsername((prev) => prev || data.user!.email!.split("@")[0]);
      }
    });

    void supabaseClient
      .from("user_settings")
      .select("show_phone_to, show_online_to")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          return;
        }
        setState((prev) => ({
          ...prev,
          showPhoneTo: (data.show_phone_to as Visibility) ?? "contacts",
          showOnlineTo: (data.show_online_to as Visibility) ?? "everyone"
        }));
      });
  }, [userId]);

  async function saveSettings() {
    if (!userId || !supabaseClient || !hasSupabaseEnv) {
      return;
    }

    setSaving(true);

    const { data: userData } = await supabaseClient.auth.getUser();
    const fallbackUsername = userData.user?.email?.split("@")[0] ?? `user_${userId.slice(0, 8)}`;

    await supabaseClient.from("profiles").upsert(
      {
        id: userId,
        username: username || fallbackUsername,
        full_name: state.fullName || null,
        about: state.about || null,
        avatar_url: state.avatarUrl || null
      },
      { onConflict: "id" }
    );

    await supabaseClient.from("user_settings").upsert(
      {
        user_id: userId,
        show_phone_to: state.showPhoneTo,
        show_online_to: state.showOnlineTo
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
  }

  async function uploadAvatar(file: File) {
    if (!userId || !supabaseClient || !hasSupabaseEnv) {
      return;
    }

    setUploadingAvatar(true);
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${crypto.randomUUID()}.${extension}`;
    const uploadResult = await supabaseClient.storage.from("avatars").upload(path, file, {
      contentType: file.type,
      upsert: false
    });

    if (!uploadResult.error) {
      const { data } = supabaseClient.storage.from("avatars").getPublicUrl(path);
      setState((prev) => ({ ...prev, avatarUrl: data.publicUrl }));
      const { data: userData } = await supabaseClient.auth.getUser();
      const fallbackUsername = userData.user?.email?.split("@")[0] ?? `user_${userId.slice(0, 8)}`;
      await supabaseClient.from("profiles").upsert(
        {
          id: userId,
          username: username || fallbackUsername,
          avatar_url: data.publicUrl
        },
        { onConflict: "id" }
      );
    }

    setUploadingAvatar(false);
  }

  return {
    state,
    setState,
    saving,
    uploadingAvatar,
    saveSettings,
    uploadAvatar
  };
}

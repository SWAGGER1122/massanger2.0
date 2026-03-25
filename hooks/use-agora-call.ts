"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { agoraConfig, getAgoraRtc } from "@/lib/agora/client";
import { supabaseClient } from "@/lib/supabase/client";

type CallKind = "audio" | "video";

function uidFromUserId(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return (hash % 2147483646) + 1;
}

export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<ILocalAudioTrack | null>(null);
  const videoTrackRef = useRef<ILocalVideoTrack | null>(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const canUseAgora = useMemo(() => agoraConfig.appId.length > 0, []);

  const startCall = useCallback(
    async ({ channel, uid, kind }: { channel: string; uid: string; kind: CallKind }) => {
      if (!canUseAgora) {
        return;
      }

      async function fetchToken(requestUid: string | number) {
        if (!supabaseClient) {
          throw new Error("Supabase client is not initialized");
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
          throw new Error("User is not authenticated");
        }

        const { data, error } = await supabaseClient.functions.invoke("agora-token", {
          body: {
            channelName: channel,
            uid: requestUid
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          throw new Error(error.message || "Failed to fetch Agora token");
        }

        if (!data?.token) {
          throw new Error("Agora token is missing in response");
        }

        return data.token;
      }

      const AgoraRTC = await getAgoraRtc();
      // Отключаем сбор аналитики и логов, чтобы избежать сетевых ошибок в консоли
      AgoraRTC.disableLogUpload();
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Используем 0 как UID для автоматической генерации числового UID в Agora
      const token = await fetchToken(0);

      try {
        await client.join(agoraConfig.appId, channel, token, 0);
      } catch (err) {
        console.error("Failed to join Agora channel:", err);
        throw err;
      }

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      audioTrackRef.current = audioTrack;

      if (kind === "video") {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        videoTrackRef.current = videoTrack;
        await client.publish([audioTrack, videoTrack]);
      } else {
        await client.publish([audioTrack]);
      }

      setConnected(true);
    },
    [canUseAgora]
  );

  const toggleMute = useCallback(async () => {
    const next = !muted;
    setMuted(next);
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(!next);
    }
  }, [muted]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraOff;
    setCameraOff(next);
    if (videoTrackRef.current) {
      await videoTrackRef.current.setEnabled(!next);
    }
  }, [cameraOff]);

  const endCall = useCallback(async () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.close();
      audioTrackRef.current = null;
    }

    if (videoTrackRef.current) {
      videoTrackRef.current.close();
      videoTrackRef.current = null;
    }

    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }

    setConnected(false);
    setMuted(false);
    setCameraOff(false);
  }, []);

  return {
    connected,
    muted,
    cameraOff,
    canUseAgora,
    startCall,
    toggleMute,
    toggleCamera,
    endCall
  };
}

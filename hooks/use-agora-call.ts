"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { agoraConfig, getAgoraRtc } from "@/lib/agora/client";

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

      if (!agoraConfig.tokenServerUrl) {
        throw new Error("Missing NEXT_PUBLIC_AGORA_TOKEN_URL");
      }

      async function fetchToken(requestUid: string | number) {
        const response = await fetch(agoraConfig.tokenServerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            channelName: channel,
            uid: requestUid
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to fetch Agora token");
        }

        const payload = (await response.json()) as { token?: string };
        if (!payload.token) {
          throw new Error("Agora token is missing in response");
        }

        return payload.token;
      }

      const AgoraRTC = await getAgoraRtc();
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      let token = await fetchToken(uid);
      let joinUid: string | number = uid;

      try {
        await client.join(agoraConfig.appId, channel, token, joinUid);
      } catch {
        joinUid = uidFromUserId(uid);
        token = await fetchToken(joinUid);
        await client.join(agoraConfig.appId, channel, token, joinUid);
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

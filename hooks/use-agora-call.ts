"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { agoraConfig, getAgoraRtc } from "@/lib/agora/client";
import { supabaseClient } from "@/lib/supabase/client";

type CallKind = "audio" | "video";

export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<ILocalAudioTrack | null>(null);
  const videoTrackRef = useRef<ILocalVideoTrack | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const canUseAgora = useMemo(() => agoraConfig.appId.length > 0, []);

  const setVideoContainer = useCallback((element: HTMLDivElement | null) => {
    videoContainerRef.current = element;
    if (element && videoTrackRef.current) {
      videoTrackRef.current.play(element);
    }
  }, []);

  const startCall = useCallback(
    async ({ channel, uid, kind }: { channel: string; uid: string; kind: CallKind }) => {
      if (!canUseAgora) {
        return;
      }

      async function fetchToken(requestUid: string | number) {
        if (!supabaseClient) {
          throw new Error("Supabase client is not initialized");
        }

        const {
          data: { session }
        } = await supabaseClient.auth.getSession();
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
      AgoraRTC.disableLogUpload();
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      const token = await fetchToken(0);

      await client.join(agoraConfig.appId, channel, token, 0);

      if (kind === "video") {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        audioTrackRef.current = audioTrack;
        videoTrackRef.current = videoTrack;
        if (videoContainerRef.current) {
          videoTrack.play(videoContainerRef.current);
        }
        await client.publish([audioTrack, videoTrack]);
      } else {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        audioTrackRef.current = audioTrack;
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
      if (!next && videoContainerRef.current) {
        videoTrackRef.current.play(videoContainerRef.current);
      }
    }
  }, [cameraOff]);

  const endCall = useCallback(async () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current.close();
      audioTrackRef.current = null;
    }

    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
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
    endCall,
    setVideoContainer
  };
}

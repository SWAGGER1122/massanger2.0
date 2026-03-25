"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, Phone, Send, Square, Video } from "lucide-react";
import { UseChatReturn } from "@/hooks/use-chat";

interface MessageInputProps {
  chatState: UseChatReturn;
  onOpenCall: (kind: "audio" | "video") => void;
}

export function MessageInput({ chatState, onOpenCall }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/ogg;codecs=opus";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      console.log("Voice recorder started", { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        console.log("Voice recorder stopped", { durationSec, size: blob.size, mimeType });
        setSavingVoice(true);
        void chatState.sendVoiceMessage(blob, durationSec).finally(() => {
          setSavingVoice(false);
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Voice recorder failed to start", error);
      setRecording(false);
    }
  }

  function stopRecording() {
    if (!recorderRef.current) {
      return;
    }
    console.log("Voice recorder stop requested");
    recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <div className="glass-panel mt-3 flex items-center gap-1.5 rounded-2xl p-2 sm:gap-2 sm:rounded-3xl sm:p-3">
      <button
        onClick={() => {
          if (recording) {
            stopRecording();
            return;
          }
          void startRecording();
        }}
        className={`rounded-xl border p-2 transition ${
          recording ? "border-rose-400/70 bg-rose-500/20 text-rose-200" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
        }`}
      >
        {savingVoice ? <Loader2 size={18} className="animate-spin" /> : recording ? <Square size={18} /> : <Mic size={18} />}
      </button>

      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            chatState.sendMessage(value);
            setValue("");
          }
        }}
        placeholder="Введите сообщение"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 sm:rounded-2xl sm:px-4"
      />

      <button
        onClick={() => onOpenCall("audio")}
        className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10"
      >
        <Phone size={18} />
      </button>

      <button
        onClick={() => onOpenCall("video")}
        className="hidden rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10 sm:block"
      >
        <Video size={18} />
      </button>

      <button
        onClick={() => {
          chatState.sendMessage(value);
          setValue("");
        }}
        className="rounded-xl bg-sky-500 p-2 text-white transition hover:bg-sky-400"
      >
        <Send size={18} />
      </button>
    </div>
  );
}

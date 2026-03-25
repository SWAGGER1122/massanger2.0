"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MicOff, PhoneOff, VideoOff } from "lucide-react";

interface CallModalProps {
  open: boolean;
  kind: "audio" | "video";
  contactName: string;
  muted: boolean;
  cameraOff: boolean;
  connected: boolean;
  canUseAgora: boolean;
  onVideoContainerChange: (element: HTMLDivElement | null) => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onClose: () => void;
}

export function CallModal({
  open,
  kind,
  contactName,
  muted,
  cameraOff,
  connected,
  canUseAgora,
  onVideoContainerChange,
  onToggleMute,
  onToggleCamera,
  onClose
}: CallModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/60 p-6 backdrop-blur-md"
          >
            <p className="text-center text-lg font-semibold">{kind === "video" ? "Видео звонок" : "Аудио звонок"}</p>
            <p className="mt-1 text-center text-sm text-zinc-400">{contactName}</p>
            <p className="mt-1 text-center text-xs text-zinc-500">
              {canUseAgora ? (connected ? "Подключено к Agora" : "Подключение...") : "Добавьте NEXT_PUBLIC_AGORA_APP_ID"}
            </p>

            <div
              ref={kind === "video" ? onVideoContainerChange : undefined}
              className="my-6 h-48 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700/30 to-violet-900/30"
            />

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onToggleMute}
                className={`rounded-full p-3 transition ${muted ? "bg-amber-500 text-black" : "bg-white/10 text-zinc-200 hover:bg-white/20"}`}
              >
                <MicOff size={20} />
              </button>
              <button
                onClick={onToggleCamera}
                className={`rounded-full p-3 transition ${cameraOff ? "bg-amber-500 text-black" : "bg-white/10 text-zinc-200 hover:bg-white/20"}`}
              >
                <VideoOff size={20} />
              </button>
              <button onClick={onClose} className="rounded-full bg-rose-500 p-3 text-white transition hover:bg-rose-400">
                <PhoneOff size={20} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

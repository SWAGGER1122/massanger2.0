"use client";

import { useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface VoiceMessagePlayerProps {
  url: string;
  durationSec: number | null;
}

export function VoiceMessagePlayer({ url, durationSec }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const bars = useMemo(() => Array.from({ length: 24 }, (_, index) => (Math.sin(index * 0.65) + 1.25) * 9), []);

  function togglePlayback() {
    if (!audioRef.current) {
      return;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    void audioRef.current.play();
    setPlaying(true);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlayback}
        className="rounded-full bg-sky-500/85 p-1.5 text-white transition hover:bg-sky-400"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <div className="relative flex h-8 w-36 items-end gap-[2px] rounded-xl border border-white/10 bg-white/5 px-1 py-1">
        {bars.map((bar, index) => {
          const ratio = (index + 1) / bars.length;
          const active = ratio <= progress;
          return (
            <span key={`${bar}-${index}`} className={`w-1 rounded-full ${active ? "bg-sky-300" : "bg-zinc-500/70"}`} style={{ height: `${bar}px` }} />
          );
        })}
      </div>

      <span className="text-xs text-zinc-400">{durationSec ?? 0}s</span>

      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (!audioRef.current || !audioRef.current.duration) {
            return;
          }
          setProgress(audioRef.current.currentTime / audioRef.current.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
    </div>
  );
}

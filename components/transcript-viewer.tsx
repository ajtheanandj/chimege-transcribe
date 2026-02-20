"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2 } from "lucide-react";

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

const SPEAKER_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
];

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TranscriptViewer({
  segments,
  audioUrl,
}: {
  segments: Segment[];
  audioUrl?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const speakers = [...new Set(segments.map((s) => s.speaker))];
  const speakerColorMap = new Map(
    speakers.map((s, i) => [s, SPEAKER_COLORS[i % SPEAKER_COLORS.length]]),
  );

  const handleCopy = async () => {
    const text = segments
      .map(
        (s) =>
          `[${formatTimestamp(s.start)} - ${formatTimestamp(s.end)}] ${s.speaker}:\n${s.text}`,
      )
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  return (
    <div className="space-y-4">
      {/* Audio player */}
      {audioUrl && (
        <audio
          ref={audioRef}
          controls
          className="w-full rounded-lg"
          preload="metadata"
        >
          <source src={audioUrl} />
        </audio>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {speakers.map((speaker) => (
            <Badge
              key={speaker}
              variant="outline"
              className={speakerColorMap.get(speaker)}
            >
              {speaker}
            </Badge>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
              Хуулсан
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Хуулах
            </>
          )}
        </Button>
      </div>

      {/* Segments */}
      <div className="space-y-3">
        {segments.map((segment, i) => (
          <div
            key={i}
            className="group flex gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <button
              onClick={() => seekTo(segment.start)}
              className="text-xs text-muted-foreground hover:text-primary font-mono shrink-0 pt-0.5"
              title="Энд очих"
            >
              {formatTimestamp(segment.start)}
            </button>
            <div className="min-w-0">
              <Badge
                variant="outline"
                className={`text-xs mb-1 ${speakerColorMap.get(segment.speaker)}`}
              >
                {segment.speaker}
              </Badge>
              <p className="text-sm leading-relaxed">{segment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

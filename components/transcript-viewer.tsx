"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Sparkles, ListChecks, Lightbulb, CircleCheckBig } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface MeetingSummary {
  overview: string;
  key_points: string[];
  action_items: string[];
  decisions: string[];
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
  summary,
}: {
  segments: Segment[];
  audioUrl?: string | null;
  summary?: MeetingSummary | null;
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
      {/* AI Summary */}
      {summary && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Хураангуй / Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{summary.overview}</p>

            {summary.key_points.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Гол санаанууд / Key Points
                </h4>
                <ul className="space-y-1">
                  {summary.key_points.map((point, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary shrink-0">-</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.action_items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <ListChecks className="h-3.5 w-3.5" />
                  Хийх ажлууд / Action Items
                </h4>
                <ul className="space-y-1">
                  {summary.action_items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary shrink-0">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.decisions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <CircleCheckBig className="h-3.5 w-3.5" />
                  Шийдвэрүүд / Decisions
                </h4>
                <ul className="space-y-1">
                  {summary.decisions.map((decision, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary shrink-0">-</span>
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Clock, Users, FileAudio } from "lucide-react";
import { TranscriptViewer } from "@/components/transcript-viewer";

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} мин ${s} сек`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function TranscriptionSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-muted rounded" />
        <div className="h-8 w-64 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-muted rounded-xl" />
    </div>
  );
}

async function TranscriptionContent({ id }: { id: string }) {
  const supabase = await createClient();
  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const { data: transcription, error } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !transcription) {
    redirect("/protected");
  }

  const segments: Segment[] = transcription.result?.segments ?? [];
  const summary = transcription.result?.summary ?? null;
  const speakers = [...new Set(segments.map((s: Segment) => s.speaker))];

  // Build download text with summary + transcript
  const summaryText = summary
    ? [
        "=== AI ХУРААНГУЙ / SUMMARY ===",
        "",
        summary.overview,
        "",
        ...(summary.key_points?.length
          ? ["--- Гол санаанууд / Key Points ---", ...summary.key_points.map((p: string) => `- ${p}`), ""]
          : []),
        ...(summary.action_items?.length
          ? ["--- Хийх ажлууд / Action Items ---", ...summary.action_items.map((a: string) => `- ${a}`), ""]
          : []),
        ...(summary.decisions?.length
          ? ["--- Шийдвэрүүд / Decisions ---", ...summary.decisions.map((d: string) => `- ${d}`), ""]
          : []),
        "=== БИЧВЭР / TRANSCRIPT ===",
        "",
      ].join("\n")
    : "";

  const transcriptText = segments
    .map(
      (s: Segment) =>
        `[${formatTimestamp(s.start)} - ${formatTimestamp(s.end)}] ${s.speaker}:\n${s.text}`,
    )
    .join("\n\n");

  const plainText = summaryText + transcriptText;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/protected">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{transcription.file_name}</h1>
            <p className="text-muted-foreground text-sm">
              {new Date(transcription.created_at).toLocaleDateString("mn-MN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {transcription.status === "complete" && (
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(plainText)}`}
            download={`${transcription.file_name.replace(/\.[^.]+$/, "")}-transcript.txt`}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground shadow h-9 px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            TXT татах
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Үргэлжлэх хугацаа</span>
            </div>
            <p className="font-semibold mt-1">
              {formatDuration(transcription.duration_seconds)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Илтгэгчид</span>
            </div>
            <p className="font-semibold mt-1">{speakers.length} хүн</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileAudio className="h-4 w-4" />
              <span>Хэсгүүд</span>
            </div>
            <p className="font-semibold mt-1">{segments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <Badge
              variant={
                transcription.status === "complete" ? "outline" : "destructive"
              }
            >
              {transcription.status === "complete"
                ? "Дууссан"
                : transcription.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {transcription.status === "complete" && segments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Бичвэр</CardTitle>
            <CardDescription>
              Transcript with speaker labels and timestamps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TranscriptViewer
              segments={segments}
              audioUrl={transcription.file_url}
              summary={summary}
            />
          </CardContent>
        </Card>
      ) : transcription.status === "failed" ? (
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">Алдаа гарлаа</p>
            <p className="text-sm text-muted-foreground mt-1">
              {transcription.error_message ?? "Боловсруулалт амжилтгүй"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Бичвэр бэлэн болоогүй байна
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function ParamsResolver({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TranscriptionContent id={id} />;
}

export default function TranscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<TranscriptionSkeleton />}>
      <ParamsResolver params={params} />
    </Suspense>
  );
}

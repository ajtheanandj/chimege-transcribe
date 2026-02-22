"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileAudio,
  Loader2,
  CheckCircle2,
  XCircle,
  Mic,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AudioRecorder } from "@/components/audio-recorder";

const ACCEPTED_TYPES: Record<string, string[]> = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "audio/x-m4a": [".m4a"],
  "audio/mp4": [".m4a"],
  "audio/webm": [".webm"],
};

const STEPS = [
  {
    key: "pending",
    label: "Хүлээгдэж байна",
    labelEn: "Queued",
    icon: Loader2,
  },
  {
    key: "converting",
    label: "Хөрвүүлж байна",
    labelEn: "Converting audio",
    icon: Mic,
  },
  {
    key: "diarizing",
    label: "Илтгэгч ялгаж байна",
    labelEn: "Detecting speakers",
    icon: Users,
  },
  {
    key: "transcribing",
    label: "Текст болгож байна",
    labelEn: "Transcribing",
    icon: FileText,
  },
  {
    key: "summarizing",
    label: "Хураангуй гаргаж байна",
    labelEn: "Generating summary",
    icon: FileText,
  },
  {
    key: "complete",
    label: "Дууссан",
    labelEn: "Complete",
    icon: CheckCircle2,
  },
];

type TranscriptionStatus =
  | "idle"
  | "uploading"
  | "pending"
  | "processing"
  | "converting"
  | "diarizing"
  | "transcribing"
  | "summarizing"
  | "complete"
  | "failed";

export function TranscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get("id");

  const [file, setFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [status, setStatus] = useState<TranscriptionStatus>(
    existingId ? "pending" : "idle",
  );
  const [transcriptionId, setTranscriptionId] = useState<string | null>(
    existingId,
  );
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const supabase = createClient();

  // Handle shared files from Share Target API
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "share-target" && event.data.files?.length) {
          const sharedFile = event.data.files[0] as File;
          setFile(sharedFile);
          setShowUpload(true);
        }
      });
    }
  }, []);

  // Auto-upload shared file
  const shared = searchParams.get("shared");
  useEffect(() => {
    if (shared === "1") {
      setShowUpload(true);
    }
  }, [shared]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message ?? "Файл хүлээн авахгүй";
      setError(msg);
    },
  });

  // Common upload logic for both recorder and file upload
  const uploadAndTranscribe = async (
    audioBlob: Blob,
    fileName: string,
  ) => {
    try {
      setStatus("uploading");
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Нэвтэрнэ үү");
        setStatus("idle");
        return;
      }

      const filePath = `${user.id}/${Date.now()}-${fileName}`;
      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(filePath, audioBlob);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadProgress(70);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: fileName,
          file_path: filePath,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        if (res.status === 502) {
          throw new Error(
            "Python backend холбогдож чадсангүй. `npm run dev` ажиллаж байгаа эсэхийг шалгана уу. / Python backend not running. Make sure `npm run dev` starts both servers.",
          );
        }
        throw new Error(body.error ?? "Алдаа гарлаа");
      }

      const data = await res.json();
      setTranscriptionId(data.id);
      setStatus("pending");
      setUploadProgress(100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      setStatus("idle");
    }
  };

  // Handle recording complete
  const handleRecordingComplete = useCallback(
    (blob: Blob, duration: number) => {
      const ts = new Date()
        .toISOString()
        .slice(0, 16)
        .replace("T", "_")
        .replace(":", "-");
      const fileName = `recording_${ts}.webm`;
      uploadAndTranscribe(blob, fileName);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Handle file upload
  const handleFileUpload = () => {
    if (!file) return;
    uploadAndTranscribe(file, file.name);
  };

  // Poll for status updates
  useEffect(() => {
    if (
      !transcriptionId ||
      status === "idle" ||
      status === "uploading" ||
      status === "complete" ||
      status === "failed"
    ) {
      return;
    }

    const PENDING_STALE_MS = 30_000; // 30s — Python never picked it up
    const ACTIVE_STALE_MS = 5 * 60_000; // 5min — overall processing timeout

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/transcribe/${transcriptionId}`);
        if (!res.ok) return;
        const data = await res.json();

        setStatus(data.status);

        if (data.status === "complete") {
          clearInterval(interval);
          if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
          router.push(`/protected/transcription/${transcriptionId}`);
          return;
        }

        if (data.status === "failed") {
          clearInterval(interval);
          setError(data.error_message ?? "Боловсруулалт амжилтгүй боллоо");
          return;
        }

        // Safety net: detect stale jobs
        if (data.created_at) {
          const elapsed = Date.now() - new Date(data.created_at).getTime();
          if (data.status === "pending" && elapsed > PENDING_STALE_MS) {
            clearInterval(interval);
            setError(
              "Python backend хариу өгөхгүй байна. `npm run dev` ажиллаж байгаа эсэхийг шалгана уу. / Python backend not responding.",
            );
            setStatus("failed");
            return;
          }
          if (elapsed > ACTIVE_STALE_MS) {
            clearInterval(interval);
            setError("Боловсруулалт хэт удсан байна. Дахин оролдоно уу. / Processing timed out.");
            setStatus("failed");
            return;
          }
        }
      } catch {
        // Polling error — will retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transcriptionId, status, router]);

  const isProcessing =
    status === "pending" ||
    status === "processing" ||
    status === "converting" ||
    status === "diarizing" ||
    status === "transcribing" ||
    status === "summarizing";

  const currentStepIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Recorder — PRIMARY UX (only show when idle) */}
      {status === "idle" && (
        <>
          <div className="text-center pt-4 sm:pt-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Шинэ бичвэр</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Record or upload audio
            </p>
          </div>

          {/* Big recorder card */}
          <Card className="overflow-hidden">
            <CardContent className="pt-8 pb-8">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            </CardContent>
          </Card>

          {/* Secondary: file upload */}
          <div className="text-center">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Эсвэл файл оруулах</span>
              <span className="text-xs opacity-60">/ Or upload a file</span>
              {showUpload ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          {showUpload && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  {isDragActive ? (
                    <p className="text-primary font-medium text-sm">
                      Файлаа энд тавина уу
                    </p>
                  ) : (
                    <>
                      <p className="font-medium text-sm mb-1">
                        Файл чирж оруулах эсвэл сонгох
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP3, WAV, OGG, M4A, WebM — 500MB хүртэл
                      </p>
                    </>
                  )}
                </div>

                {file && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileAudio className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleFileUpload}>
                      <Upload className="h-4 w-4 mr-1" />
                      Илгээх
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </>
      )}

      {/* Uploading progress */}
      {status === "uploading" && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
            <p className="font-medium mb-2">Байршуулж байна...</p>
            <p className="text-xs text-muted-foreground mb-4">Uploading...</p>
            <div className="w-48 mx-auto h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing steps */}
      {isProcessing && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Боловсруулж байна</CardTitle>
            <CardDescription>
              Энэ хэдэн минут болно / This may take a few minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const isActive = step.key === status;
                const isDone = currentStepIndex > i;
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      isActive ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDone
                          ? "bg-green-500/10 text-green-500"
                          : isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          !isDone && !isActive ? "text-muted-foreground" : ""
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.labelEn}
                      </p>
                    </div>
                    {isActive && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Идэвхтэй
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {status === "failed" && (
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <p className="font-medium text-destructive mb-2">Алдаа гарлаа</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error ?? "Боловсруулалт амжилтгүй боллоо"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setStatus("idle");
                setFile(null);
                setTranscriptionId(null);
                setError(null);
              }}
            >
              Дахин оролдох
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

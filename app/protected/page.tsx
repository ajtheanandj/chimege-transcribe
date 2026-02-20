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
import {
  Plus,
  FileAudio,
  Clock,
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Loader2 }
> = {
  pending: { label: "Хүлээгдэж байна", variant: "secondary", icon: Clock },
  processing: { label: "Боловсруулж байна", variant: "default", icon: Loader2 },
  converting: { label: "Хөрвүүлж байна", variant: "default", icon: Loader2 },
  diarizing: { label: "Илтгэгч ялгаж байна", variant: "default", icon: Loader2 },
  transcribing: { label: "Текст болгож байна", variant: "default", icon: Loader2 },
  complete: { label: "Дууссан", variant: "outline", icon: CheckCircle2 },
  failed: { label: "Алдаа гарлаа", variant: "destructive", icon: XCircle },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-9 w-48 bg-muted rounded" />
        <div className="h-9 w-32 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

async function DashboardContent() {
  const supabase = await createClient();
  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub as string;

  const { data: transcriptions } = await supabase
    .from("transcriptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: usageData } = await supabase
    .from("usage")
    .select("minutes_used")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .single();

  const minutesUsed = Number(usageData?.minutes_used ?? 0);
  const totalTranscriptions = transcriptions?.length ?? 0;
  const completedCount =
    transcriptions?.filter((t) => t.status === "complete").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Хяналтын самбар</h1>
          <p className="text-muted-foreground mt-1">Dashboard</p>
        </div>
        <Button asChild>
          <Link href="/protected/transcribe">
            <Plus className="h-4 w-4 mr-2" />
            Шинэ бичвэр
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Энэ сарын хэрэглээ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {minutesUsed.toFixed(1)}
              </span>
              <span className="text-muted-foreground">минут</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Нийт бичвэрүүд</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileAudio className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalTranscriptions}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Дууссан</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{completedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Бичвэрүүд</CardTitle>
          <CardDescription>Таны бүх бичвэрүүд</CardDescription>
        </CardHeader>
        <CardContent>
          {!transcriptions || transcriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileAudio className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Одоогоор бичвэр байхгүй байна
              </p>
              <Button asChild variant="outline">
                <Link href="/protected/transcribe">
                  <Plus className="h-4 w-4 mr-2" />
                  Эхний бичвэрээ үүсгэх
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {transcriptions.map((t) => {
                const statusInfo = STATUS_MAP[t.status] ?? {
                  label: t.status,
                  variant: "secondary" as const,
                  icon: AlertCircle,
                };
                const StatusIcon = statusInfo.icon;
                return (
                  <Link
                    key={t.id}
                    href={
                      t.status === "complete"
                        ? `/protected/transcription/${t.id}`
                        : `/protected/transcribe?id=${t.id}`
                    }
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileAudio className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(t.created_at)}
                          {t.duration_seconds &&
                            ` · ${formatDuration(t.duration_seconds)}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant} className="shrink-0 ml-2">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

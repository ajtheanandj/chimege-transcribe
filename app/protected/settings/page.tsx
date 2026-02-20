import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
import { User, CreditCard, Shield } from "lucide-react";

async function SettingsContent() {
  const supabase = await createClient();
  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const email = claimsData.claims.email as string;
  const userId = claimsData.claims.sub as string;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: usageData } = await supabase
    .from("usage")
    .select("minutes_used")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .single();

  const minutesUsed = Number(usageData?.minutes_used ?? 0);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Тохиргоо</h1>
        <p className="text-muted-foreground text-sm">Settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Хэрэглэгч</CardTitle>
              <CardDescription>{email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Хэрэглээ</CardTitle>
              <CardDescription>Энэ сарын хэрэглээ / This month</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Ашигласан минут
            </span>
            <span className="font-semibold">{minutesUsed.toFixed(1)} мин</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Төлөвлөгөө</span>
            <Badge variant="secondary">Үнэгүй / Free</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Апп суулгах</CardTitle>
              <CardDescription>Install this app</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Энэ апп-ыг утасны дэлгэц дээр суулгаж болно. Хөтөчийн цэснээс
            &quot;Add to Home Screen&quot; эсвэл &quot;Install App&quot; сонгоно
            уу.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-muted rounded-xl" />
      ))}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

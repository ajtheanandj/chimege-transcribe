import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { BottomNav } from "@/components/bottom-nav";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";
import Link from "next/link";
import { Suspense } from "react";
import { Mic } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Top nav — desktop visible, mobile minimal */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 sm:h-16">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-4 sm:px-5 text-sm">
            <div className="flex gap-6 items-center">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg"
              >
                <Mic className="h-5 w-5 text-primary" />
                <span className="hidden sm:inline">Хурлын Тэмдэглэл</span>
                <span className="sm:hidden">ХТ</span>
              </Link>
              <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
                <Link
                  href="/protected"
                  className="hover:text-foreground transition-colors"
                >
                  Хяналтын самбар
                </Link>
                <Link
                  href="/protected/transcribe"
                  className="hover:text-foreground transition-colors"
                >
                  Шинэ бичвэр
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeSwitcher />
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
        </nav>

        {/* Main content — extra bottom padding on mobile for bottom nav */}
        <div className="flex-1 w-full max-w-6xl p-4 sm:p-5 pb-24 sm:pb-8">
          {children}
        </div>

        {/* Footer — desktop only */}
        <footer className="hidden sm:flex w-full items-center justify-center border-t text-center text-xs text-muted-foreground gap-4 py-6">
          <p>&copy; 2026 Хурлын Тэмдэглэл</p>
          <span>&middot;</span>
          <p>Powered by Chimege AI</p>
        </footer>
      </div>

      {/* Bottom nav — mobile only */}
      <Suspense>
        <BottomNav />
      </Suspense>
    </main>
  );
}

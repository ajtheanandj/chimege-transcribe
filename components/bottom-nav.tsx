"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/protected/transcribe",
    icon: Mic,
    label: "Бичих",
    labelEn: "Record",
  },
  {
    href: "/protected",
    icon: Clock,
    label: "Түүх",
    labelEn: "History",
    exact: true,
  },
  {
    href: "/protected/settings",
    icon: Settings,
    label: "Тохиргоо",
    labelEn: "Settings",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

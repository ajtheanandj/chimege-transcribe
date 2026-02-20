"use client";

import { Suspense } from "react";
import { TranscribeContent } from "@/components/transcribe-content";

export default function TranscribePage() {
  return (
    <Suspense>
      <TranscribeContent />
    </Suspense>
  );
}

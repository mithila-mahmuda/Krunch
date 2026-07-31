"use client";

import { useEffect } from "react";
import { usePosStore } from "@/store/pos-store";

export function StatusToast() {
  const statusMessage = usePosStore((state) => state.statusMessage);
  const setStatusMessage = usePosStore((state) => state.setStatusMessage);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [statusMessage, setStatusMessage]);

  if (!statusMessage) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[80] flex justify-center px-4 lg:bottom-6">
      <p className="rounded-full bg-[var(--pos-header)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
        {statusMessage}
      </p>
    </div>
  );
}

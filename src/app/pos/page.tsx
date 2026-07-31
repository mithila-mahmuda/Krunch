"use client";

import dynamic from "next/dynamic";
import { RequireAuth } from "@/components/auth/RequireAuth";

const PosScreen = dynamic(
  () =>
    import("@/components/pos/PosScreen").then((mod) => mod.PosScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-[var(--pos-menu)] text-white">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Loading till…
        </p>
      </div>
    ),
  },
);

export default function PosPage() {
  return (
    <RequireAuth>
      <PosScreen />
    </RequireAuth>
  );
}

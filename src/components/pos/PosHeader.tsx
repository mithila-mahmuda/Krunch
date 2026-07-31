"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search } from "lucide-react";
import { formatTillClock } from "@/lib/format";
import { TILL_NAME } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { usePosStore } from "@/store/pos-store";

export function PosHeader() {
  const router = useRouter();
  const setNavOpen = usePosStore((state) => state.setNavOpen);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 bg-[var(--pos-header)] px-3 text-white shadow-sm">
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95"
        aria-label="Open navigation"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
          krunch
        </span>
        <span className="hidden h-5 w-px bg-white/30 sm:block" />
        <p className="truncate text-sm font-medium tracking-wide text-white/90">
          {user?.name ?? "Staff"} · {TILL_NAME}
          {now ? ` · ${formatTillClock(now)}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95"
          aria-label="Search products"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search, ShoppingCart } from "lucide-react";
import { formatMoney, formatTillClock } from "@/lib/format";
import { TILL_NAME } from "@/lib/mock-data";
import { computeTotals } from "@/lib/order-math";
import { useAuthStore } from "@/store/auth-store";
import { usePosStore } from "@/store/pos-store";

export function PosHeader() {
  const router = useRouter();
  const setNavOpen = usePosStore((state) => state.setNavOpen);
  const setOrderPanelOpen = usePosStore((state) => state.setOrderPanelOpen);
  const setSearchOpen = usePosStore((state) => state.setSearchOpen);
  const lines = usePosStore((state) => state.lines);
  const serviceEnabled = usePosStore((state) => state.serviceEnabled);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [now, setNow] = useState<Date | null>(null);
  const totals = computeTotals(lines, serviceEnabled);

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
    <header className="flex min-h-14 shrink-0 items-center gap-2 bg-[var(--pos-header)] px-2 pt-[env(safe-area-inset-top)] text-white shadow-sm sm:gap-3 sm:px-3">
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95"
        aria-label="Open navigation"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <span className="shrink-0 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight sm:text-xl">
          krunch
        </span>
        <span className="hidden h-5 w-px bg-white/30 sm:block" />
        <p className="hidden min-w-0 truncate text-sm font-medium tracking-wide text-white/90 sm:block">
          {user?.name ?? "Staff"} · {TILL_NAME}
          {now ? ` · ${formatTillClock(now)}` : ""}
        </p>
        <p className="truncate text-xs font-medium tracking-wide text-white/90 sm:hidden">
          {user?.name ?? "Staff"}
          {now ? ` · ${formatTillClock(now)}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setOrderPanelOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95 lg:hidden"
          aria-label={`Open order${totals.itemCount ? `, ${totals.itemCount} items, ${formatMoney(totals.due)}` : ""}`}
        >
          <ShoppingCart className="h-5 w-5" />
          {totals.itemCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--action-pay)] px-1 text-[10px] font-bold leading-none text-white">
              {totals.itemCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95"
          aria-label="Search products"
          aria-keyshortcuts="/ Control+K Meta+K"
          title="Search products (/ or Ctrl+K)"
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

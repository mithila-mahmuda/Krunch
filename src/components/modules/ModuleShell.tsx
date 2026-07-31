"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { NavDrawer } from "@/components/pos/NavDrawer";
import { usePosStore } from "@/store/pos-store";

interface ModuleShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ModuleShell({
  title,
  subtitle,
  actions,
  children,
}: ModuleShellProps) {
  const setNavOpen = usePosStore((state) => state.setNavOpen);

  return (
    <div className="min-h-dvh bg-[var(--module-bg)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          <Link
            href="/pos"
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[var(--pos-accent)] hover:bg-[var(--pos-accent-soft)]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">POS</span>
            <span className="hidden sm:inline">Back to POS</span>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-[family-name:var(--font-display)] text-lg font-bold tracking-tight sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {actions}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>

      <NavDrawer />
    </div>
  );
}

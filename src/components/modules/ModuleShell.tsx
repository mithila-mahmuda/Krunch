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
    <div className="module-shell h-dvh overflow-y-auto overscroll-contain bg-[var(--module-bg)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 hover:bg-slate-50"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link
            href="/pos"
            aria-label="Back to POS"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--pos-accent-soft)] text-[var(--pos-accent)] transition hover:bg-[var(--pos-accent)] hover:text-white active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h1 className="truncate font-[family-name:var(--font-display)] text-lg leading-tight font-bold tracking-tight sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs leading-snug text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
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

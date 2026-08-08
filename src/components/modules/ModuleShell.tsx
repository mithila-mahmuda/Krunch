"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { NavDrawer } from "@/components/pos/NavDrawer";
import { usePosStore } from "@/store/pos-store";

interface ModuleShellProps {
  title: string;
  /** Shown immediately after the title (e.g. assigned branch chip). */
  titleAddon?: ReactNode;
  actions?: ReactNode;
  /** Drop the centered max-width for full-bleed module layouts. */
  wide?: boolean;
  children: ReactNode;
}

export function ModuleShell({
  title,
  titleAddon,
  actions,
  wide = false,
  children,
}: ModuleShellProps) {
  const setNavOpen = usePosStore((state) => state.setNavOpen);

  return (
    <div
      className={`module-shell h-dvh overscroll-contain bg-[var(--module-bg)] text-slate-900 ${
        wide ? "flex flex-col overflow-hidden" : "overflow-y-auto"
      }`}
    >
      <header className="sticky top-0 z-20 shrink-0 bg-[var(--pos-header)] pt-[env(safe-area-inset-top)] text-pos-on-header shadow-sm">
        <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Menu"
            className="app-header-btn"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/pos"
            aria-label="Back to POS"
            className="app-header-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="min-w-0 truncate font-[family-name:var(--font-display)] text-lg font-bold tracking-tight sm:text-xl">
              {title}
            </h1>
            {titleAddon ? (
              <div className="shrink-0">{titleAddon}</div>
            ) : null}
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
            {actions}
            <AppHeaderActions />
          </div>
        </div>
      </header>

      <main
        className={
          wide
            ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden px-3 py-4 sm:px-4 sm:py-5"
            : "mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6"
        }
      >
        {children}
      </main>

      <NavDrawer />
    </div>
  );
}

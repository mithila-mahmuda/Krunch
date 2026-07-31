"use client";

import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { NavDrawer } from "@/components/pos/NavDrawer";
import { usePosStore } from "@/store/pos-store";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  bullets: string[];
}

export function ModulePlaceholder({
  title,
  description,
  bullets,
}: ModulePlaceholderProps) {
  const setNavOpen = usePosStore((state) => state.setNavOpen);

  return (
    <div className="min-h-dvh bg-[var(--module-bg)] text-slate-900">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--pos-accent)] sm:text-sm">
          Krunch
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
          {description}
        </p>
        <ul className="mt-6 space-y-3 sm:mt-8">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              {bullet}
            </li>
          ))}
        </ul>
      </main>

      <NavDrawer />
    </div>
  );
}

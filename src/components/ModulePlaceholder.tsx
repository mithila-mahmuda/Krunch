"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Menu
        </button>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pos-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to POS
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.2em] text-[var(--pos-accent)]">
          Krunch
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">{description}</p>
        <ul className="mt-8 space-y-3">
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

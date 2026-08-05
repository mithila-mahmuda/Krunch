"use client";

import { categories } from "@/lib/mock-data";
import type { CategoryTone } from "@/lib/types";
import { usePosStore } from "@/store/pos-store";

const toneClass: Record<CategoryTone, string> = {
  drinks: "bg-[var(--cat-drinks)] hover:brightness-105",
  food: "bg-[var(--cat-food)] hover:brightness-105",
  special: "bg-[var(--cat-special)] hover:brightness-105",
  retail: "bg-[var(--cat-retail)] hover:brightness-105",
};

type CategoryGridProps = {
  compact?: boolean;
};

export function CategoryGrid({ compact = false }: CategoryGridProps) {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);
  const setActiveCategory = usePosStore((state) => state.setActiveCategory);

  return (
    <div
      className={
        compact
          ? "grid h-full grid-cols-1 content-start gap-2 overflow-auto overscroll-contain bg-slate-100 p-2 sm:grid-cols-2 sm:gap-3 sm:p-3"
          : "grid h-full grid-cols-2 content-start gap-2 overflow-auto overscroll-contain bg-slate-100 p-2 sm:gap-3 sm:p-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      }
    >
      {categories.map((category, index) => {
        const isActive = activeCategoryId === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            aria-pressed={isActive}
            className={`pos-tile flex items-center justify-center rounded-md px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-[0.98] sm:px-3 sm:py-4 sm:text-sm md:text-base ${
              compact
                ? "min-h-[64px] sm:min-h-[80px] md:min-h-[88px]"
                : "min-h-[80px] sm:min-h-[96px] md:min-h-[104px]"
            } ${toneClass[category.tone]} ${
              isActive
                ? "ring-2 ring-[var(--pos-header)] ring-offset-2 ring-offset-slate-100 brightness-110"
                : ""
            }`}
            style={{ animationDelay: `${index * 20}ms` }}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}

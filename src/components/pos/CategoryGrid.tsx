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

export function CategoryGrid() {
  const setActiveCategory = usePosStore((state) => state.setActiveCategory);

  return (
    <div className="grid h-full grid-cols-2 content-start gap-3 overflow-auto p-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category, index) => (
        <button
          key={category.id}
          type="button"
          onClick={() => setActiveCategory(category.id)}
          className={`pos-tile flex min-h-[88px] items-center justify-center rounded-md px-3 py-4 text-center text-sm font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-[0.98] sm:min-h-[104px] sm:text-base ${toneClass[category.tone]}`}
          style={{ animationDelay: `${index * 20}ms` }}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

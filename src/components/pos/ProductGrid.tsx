"use client";

import { ArrowLeft } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { categories, products } from "@/lib/mock-data";
import { usePosStore } from "@/store/pos-store";

export function ProductGrid() {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);
  const setActiveCategory = usePosStore((state) => state.setActiveCategory);
  const addProduct = usePosStore((state) => state.addProduct);

  const category = categories.find((item) => item.id === activeCategoryId);
  const categoryProducts = products.filter(
    (product) => product.categoryId === activeCategoryId,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-w-0 items-center gap-2 border-b border-white/15 px-2 py-2.5 sm:gap-3 sm:px-3 sm:py-3">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="flex h-11 shrink-0 items-center gap-2 rounded-md bg-white/15 px-2.5 text-sm font-semibold text-white transition hover:bg-white/25 active:scale-95 sm:px-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Categories</span>
          <span className="sm:hidden">Back</span>
        </button>
        <h2 className="min-w-0 truncate text-base font-bold uppercase tracking-wide text-white sm:text-lg">
          {category?.name}
        </h2>
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-auto overscroll-contain p-2 sm:gap-3 sm:p-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {categoryProducts.map((product, index) => (
          <button
            key={product.id}
            type="button"
            onClick={() => addProduct(product)}
            className="pos-tile flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-md bg-[var(--cat-product)] px-2 py-3 text-center text-white shadow-sm transition hover:brightness-105 active:scale-[0.98] sm:min-h-[96px] sm:px-3 sm:py-4"
            style={{ animationDelay: `${index * 20}ms` }}
          >
            <span className="text-xs font-bold uppercase leading-tight tracking-wide sm:text-sm md:text-base">
              {product.name}
            </span>
            <span className="text-sm font-medium text-white/90">
              {formatMoney(product.price)}
            </span>
          </button>
        ))}

        {categoryProducts.length === 0 && (
          <p className="col-span-full px-4 py-16 text-center text-white/80">
            No products in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}

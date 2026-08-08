"use client";

import { Ban, X } from "lucide-react";
import { compareSortOrder } from "@/lib/catalog-order";
import { formatMoney } from "@/lib/format";
import { productTileStyle } from "@/lib/tile-style";
import { useCatalogStore } from "@/store/catalog-store";
import { usePosStore } from "@/store/pos-store";

export function ProductGrid() {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);
  const setActiveCategory = usePosStore((state) => state.setActiveCategory);
  const addProduct = usePosStore((state) => state.addProduct);
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);

  const category = categories.find((item) => item.id === activeCategoryId);
  const categoryProducts = products
    .filter((product) => product.categoryId === activeCategoryId)
    .sort(compareSortOrder);

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="flex min-w-0 items-center gap-2 border-b border-slate-200 px-2 py-2.5 sm:gap-3 sm:px-3 sm:py-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-bold uppercase tracking-wide text-slate-800 sm:text-lg">
          {category?.name}
        </h2>
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          aria-label="Close products"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-700 transition hover:bg-slate-300 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-auto overscroll-contain p-2 sm:gap-3 sm:p-3 lg:grid-cols-2 xl:grid-cols-3">
        {categoryProducts.map((product, index) => {
          const unavailable = product.available === false;
          return (
            <button
              key={product.id}
              type="button"
              aria-disabled={unavailable}
              onClick={() => addProduct(product)}
              className={`pos-tile relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 py-3 text-center text-white shadow-sm transition sm:min-h-[96px] sm:px-3 sm:py-4 ${
                unavailable
                  ? "cursor-not-allowed"
                  : "hover:brightness-105 active:scale-[0.98]"
              }`}
              style={{
                animationDelay: `${index * 20}ms`,
                ...productTileStyle(product, category),
              }}
            >
              {unavailable ? (
                <span
                  className="pointer-events-none absolute inset-0 bg-slate-950/50"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-[1] text-xs font-bold uppercase leading-tight tracking-wide sm:text-sm md:text-base">
                {product.name}
              </span>
              {unavailable ? (
                <span className="relative z-[1] inline-flex items-center gap-1 rounded bg-slate-950/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white sm:text-xs">
                  <Ban className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  Unavailable
                </span>
              ) : (
                <span className="relative z-[1] text-sm font-medium text-white/90">
                  {formatMoney(product.price)}
                </span>
              )}
            </button>
          );
        })}

        {categoryProducts.length === 0 && (
          <p className="col-span-full px-4 py-16 text-center text-slate-500">
            No products in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}

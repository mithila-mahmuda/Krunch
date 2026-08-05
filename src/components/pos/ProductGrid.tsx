"use client";

import { X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { categories } from "@/lib/mock-data";
import { useCatalogStore } from "@/store/catalog-store";
import { usePosStore } from "@/store/pos-store";

export function ProductGrid() {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);
  const setActiveCategory = usePosStore((state) => state.setActiveCategory);
  const addProduct = usePosStore((state) => state.addProduct);
  const products = useCatalogStore((state) => state.products);

  const category = categories.find((item) => item.id === activeCategoryId);
  const categoryProducts = products.filter(
    (product) => product.categoryId === activeCategoryId,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-w-0 items-center gap-2 border-b border-white/15 px-2 py-2.5 sm:gap-3 sm:px-3 sm:py-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-bold uppercase tracking-wide text-white sm:text-lg">
          {category?.name}
        </h2>
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          aria-label="Close products"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/25 text-white transition hover:bg-white hover:text-[var(--pos-accent)] active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-auto overscroll-contain p-2 sm:gap-3 sm:p-3 lg:grid-cols-2 xl:grid-cols-3">
        {categoryProducts.map((product, index) => {
          const soldOut = product.available === false;
          return (
            <button
              key={product.id}
              type="button"
              disabled={soldOut}
              onClick={() => addProduct(product)}
              className="pos-tile flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-md bg-[var(--cat-product)] px-2 py-3 text-center text-white shadow-sm transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[96px] sm:px-3 sm:py-4"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <span className="text-xs font-bold uppercase leading-tight tracking-wide sm:text-sm md:text-base">
                {product.name}
              </span>
              <span className="text-sm font-medium text-white/90">
                {soldOut ? "Sold out" : formatMoney(product.price)}
              </span>
            </button>
          );
        })}

        {categoryProducts.length === 0 && (
          <p className="col-span-full px-4 py-16 text-center text-white/80">
            No products in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}

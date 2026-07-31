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
      <div className="flex items-center gap-3 border-b border-white/15 px-3 py-3">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="flex h-11 items-center gap-2 rounded-md bg-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/25 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Categories
        </button>
        <h2 className="text-lg font-bold uppercase tracking-wide text-white">
          {category?.name}
        </h2>
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-auto p-3 sm:grid-cols-3 lg:grid-cols-4">
        {categoryProducts.map((product, index) => (
          <button
            key={product.id}
            type="button"
            onClick={() => addProduct(product)}
            className="pos-tile flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-md bg-[var(--cat-product)] px-3 py-4 text-center text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
            style={{ animationDelay: `${index * 20}ms` }}
          >
            <span className="text-sm font-bold uppercase leading-tight tracking-wide sm:text-base">
              {product.name}
            </span>
            <span className="text-sm font-medium text-white/90">
              {formatMoney(product.price)}
            </span>
          </button>
        ))}

        {categoryProducts.length === 0 && (
          <p className="col-span-full py-16 text-center text-white/80">
            No products in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { products } from "@/lib/mock-data";
import { PosDialog } from "@/components/pos/PosDialog";
import { usePosStore } from "@/store/pos-store";

export function ProductSearch() {
  const open = usePosStore((state) => state.searchOpen);
  const setSearchOpen = usePosStore((state) => state.setSearchOpen);
  const addProduct = usePosStore((state) => state.addProduct);
  const setOrderPanelOpen = usePosStore((state) => state.setOrderPanelOpen);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter((product) => product.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query]);

  return (
    <PosDialog
      open={open}
      title="Search products"
      onClose={() => {
        setSearchOpen(false);
        setQuery("");
      }}
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a product name"
          className="min-h-11 w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
      </div>
      <ul className="space-y-1">
        {results.map((product) => (
          <li key={product.id}>
            <button
              type="button"
              onClick={() => {
                addProduct(product);
                setSearchOpen(false);
                setQuery("");
                setOrderPanelOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-semibold">{product.name}</span>
              <span className="font-bold">{formatMoney(product.price)}</span>
            </button>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="px-3 py-8 text-center text-sm text-slate-500">
            No products match.
          </li>
        ) : null}
      </ul>
    </PosDialog>
  );
}

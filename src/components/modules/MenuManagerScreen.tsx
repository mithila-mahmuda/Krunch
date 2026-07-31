"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { categories, products } from "@/lib/mock-data";
import { ModuleShell } from "@/components/modules/ModuleShell";

export function MenuManagerScreen() {
  const [availability, setAvailability] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(products.map((product) => [product.id, true])),
  );
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const inCategory = !categoryId || product.categoryId === categoryId;
      const matches =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.id.includes(q);
      return inCategory && matches;
    });
  }, [categoryId, query]);

  const unavailableCount = Object.values(availability).filter(
    (value) => !value,
  ).length;

  function toggle(productId: string) {
    setAvailability((current) => ({
      ...current,
      [productId]: !current[productId],
    }));
  }

  return (
    <ModuleShell
      title="Menu Manager"
      subtitle={`${unavailableCount} item${unavailableCount === 1 ? "" : "s"} marked unavailable`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none ring-[var(--pos-accent)] focus:ring-2"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {visible.map((product) => {
            const available = availability[product.id] !== false;
            return (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatMoney(product.price)} ·{" "}
                    {categories.find((c) => c.id === product.categoryId)?.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(product.id)}
                  className={`min-h-10 min-w-[132px] rounded-md px-3 text-sm font-semibold transition ${
                    available
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                  }`}
                >
                  {available ? "Available" : "Sold out"}
                </button>
              </li>
            );
          })}
        </ul>
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            No products match.
          </p>
        ) : null}
      </div>
    </ModuleShell>
  );
}

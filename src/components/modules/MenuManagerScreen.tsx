"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { categories } from "@/lib/mock-data";
import { can } from "@/lib/permissions";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogStore } from "@/store/catalog-store";

export function MenuManagerScreen() {
  const products = useCatalogStore((state) => state.products);
  const toggleAvailability = useCatalogStore(
    (state) => state.toggleAvailability,
  );
  const role = useAuthStore((state) => state.user?.role);
  const canEdit = can(role, "edit_menu");

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
  }, [categoryId, products, query]);

  return (
    <ModuleShell title="Menu Manager">
      {!canEdit ? (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          View only — managers can change availability.
        </p>
      ) : null}

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
            const available = product.available !== false;
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
                  disabled={!canEdit}
                  onClick={() => toggleAvailability(product.id)}
                  className={`min-h-10 min-w-[132px] rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
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

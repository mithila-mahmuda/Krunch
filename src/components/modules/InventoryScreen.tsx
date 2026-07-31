"use client";

import { useMemo, useState } from "react";
import { INITIAL_INVENTORY } from "@/lib/module-data";
import { ModuleShell } from "@/components/modules/ModuleShell";

export function InventoryScreen() {
  const [items, setItems] = useState(INITIAL_INVENTORY);
  const [lowOnly, setLowOnly] = useState(false);

  const visible = useMemo(() => {
    const list = lowOnly
      ? items.filter((item) => item.onHand < item.parLevel)
      : items;
    return [...list].sort(
      (a, b) => a.onHand / a.parLevel - b.onHand / b.parLevel,
    );
  }, [items, lowOnly]);

  const lowCount = items.filter(
    (item) => item.onHand < item.parLevel,
  ).length;

  function adjust(id: string, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              onHand: Math.max(0, Math.round((item.onHand + delta) * 10) / 10),
            }
          : item,
      ),
    );
  }

  return (
    <ModuleShell
      title="Inventory"
      subtitle={`${lowCount} item${lowCount === 1 ? "" : "s"} below par`}
      actions={
        <button
          type="button"
          onClick={() => setLowOnly((value) => !value)}
          className={`min-h-10 rounded-md px-3 text-sm font-semibold ${
            lowOnly
              ? "bg-rose-600 text-white"
              : "border border-slate-300 bg-white hover:bg-slate-50"
          }`}
        >
          {lowOnly ? "Showing low stock" : "Low stock only"}
        </button>
      }
    >
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {visible.map((item) => {
            const low = item.onHand < item.parLevel;
            const ratio = Math.min(1, item.onHand / item.parLevel);
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.name}</p>
                    {low ? (
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold uppercase text-rose-700">
                        Low
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-500">
                    {item.category} · par {item.parLevel} {item.unit}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        low ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjust(item.id, -1)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 font-bold hover:bg-slate-50"
                    aria-label={`Decrease ${item.name}`}
                  >
                    −
                  </button>
                  <p className="min-w-[88px] text-center text-sm font-bold">
                    {item.onHand} {item.unit}
                  </p>
                  <button
                    type="button"
                    onClick={() => adjust(item.id, 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 font-bold hover:bg-slate-50"
                    aria-label={`Increase ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ModuleShell>
  );
}

"use client";

import { formatMoney } from "@/lib/format";
import { computeTotals } from "@/lib/order-math";
import { usePosStore } from "@/store/pos-store";

export function MobileOrderBar() {
  const lines = usePosStore((state) => state.lines);
  const serviceEnabled = usePosStore((state) => state.serviceEnabled);
  const setOrderPanelOpen = usePosStore((state) => state.setOrderPanelOpen);
  const totals = computeTotals(lines, serviceEnabled);

  return (
    <div className="shrink-0 border-t border-pos-on-header/15 bg-[var(--pos-header)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <button
        type="button"
        onClick={() => setOrderPanelOpen(true)}
        className="flex w-full min-h-12 items-center gap-3 rounded-lg bg-white px-4 py-3 text-left text-slate-900 shadow-sm transition active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">
            {totals.itemCount === 0 ? "Open ticket" : "Current ticket"}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {totals.itemCount === 0
              ? "No items yet"
              : `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}`}
          </span>
        </span>
        <span className="text-lg font-black tracking-tight">
          {formatMoney(totals.due)}
        </span>
      </button>
    </div>
  );
}

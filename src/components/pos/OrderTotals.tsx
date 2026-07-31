"use client";

import { formatMoney } from "@/lib/format";
import { computeTotals } from "@/lib/order-math";
import { usePosStore } from "@/store/pos-store";

export function OrderTotals() {
  const lines = usePosStore((state) => state.lines);
  const serviceEnabled = usePosStore((state) => state.serviceEnabled);
  const toggleService = usePosStore((state) => state.toggleService);
  const totals = computeTotals(lines, serviceEnabled);

  return (
    <div className="grid grid-cols-2 gap-2 border-t border-slate-200 px-2 py-2 sm:gap-3 sm:px-3">
      <div className="space-y-1.5 text-xs sm:text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-bold uppercase tracking-wide text-slate-500">
            Items
          </span>
          <span className="text-base font-bold text-slate-900 sm:text-lg">
            {totals.itemCount}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-bold uppercase tracking-wide text-slate-500">
            Discount
          </span>
          <span className="font-semibold text-slate-800">
            {formatMoney(totals.totalDiscount)}
          </span>
        </div>
        <label className="flex items-center justify-between gap-2">
          <span className="font-bold uppercase tracking-wide text-slate-500">
            Service
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={serviceEnabled}
            onClick={toggleService}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              serviceEnabled ? "bg-[var(--pos-accent)]" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                serviceEnabled ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="min-w-0 space-y-0.5 text-right">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Total
          </p>
          <p className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {formatMoney(totals.total)}
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-700">
          Due {formatMoney(totals.due)}
        </p>
        <p className="text-xs font-medium text-slate-500">
          Tax {formatMoney(totals.tax)}
        </p>
      </div>
    </div>
  );
}

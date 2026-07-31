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
    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 px-3 py-2">
      <div className="space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="font-bold uppercase tracking-wide text-slate-500">
            Items
          </span>
          <span className="text-lg font-bold text-slate-900">
            {totals.itemCount}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-bold uppercase tracking-wide text-slate-500">
            Total Discount
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
            className={`relative h-6 w-11 rounded-full transition ${
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

      <div className="space-y-0.5 text-right">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Total
          </p>
          <p className="text-2xl font-black tracking-tight text-slate-900">
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

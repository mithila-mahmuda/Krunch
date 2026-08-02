"use client";

import { formatMoney } from "@/lib/format";
import { SERVICE_RATE } from "@/lib/mock-data";
import { computeTotals } from "@/lib/order-math";
import { usePosStore } from "@/store/pos-store";

const servicePercent = Math.round(SERVICE_RATE * 100);

export function OrderTotals() {
  const lines = usePosStore((state) => state.lines);
  const serviceEnabled = usePosStore((state) => state.serviceEnabled);
  const toggleService = usePosStore((state) => state.toggleService);
  const totals = computeTotals(lines, serviceEnabled);

  return (
    <div className="grid grid-cols-2 gap-2 border-t border-slate-200 px-2.5 py-1.5">
      <div className="space-y-0.5 border-r border-slate-200 pr-2 text-[13px] leading-tight">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Items
          </span>
          <span className="text-base font-bold text-slate-900">
            {totals.itemCount}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Total Discount
          </span>
          <span className="text-[13px] font-bold text-slate-900">
            {formatMoney(totals.totalDiscount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Service
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              role="switch"
              aria-checked={serviceEnabled}
              aria-label={`Service charge ${servicePercent} percent`}
              onClick={toggleService}
              className={`relative h-4 w-7 shrink-0 rounded-full transition ${
                serviceEnabled ? "bg-[var(--pos-selected)]" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${
                  serviceEnabled ? "left-3.5" : "left-0.5"
                }`}
              />
            </button>
            <span className="min-w-10 text-right text-[13px] font-bold text-slate-900">
              {formatMoney(serviceEnabled ? totals.serviceCharge : 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-px text-right leading-tight">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Total
          </p>
          <p className="truncate text-xl font-black tracking-tight text-slate-900">
            {formatMoney(totals.total)}
          </p>
        </div>
        <p className="text-sm font-bold text-[var(--action-delete)]">
          Due {formatMoney(totals.due)}
        </p>
        <p className="text-xs font-medium text-slate-700">
          Tax {formatMoney(totals.tax)}
        </p>
      </div>
    </div>
  );
}

"use client";

import { computeTotals } from "@/lib/order-math";
import { usePosStore } from "@/store/pos-store";

export function ActionButtons() {
  const lines = usePosStore((state) => state.lines);
  const serviceEnabled = usePosStore((state) => state.serviceEnabled);
  const clearOrder = usePosStore((state) => state.clearOrder);
  const totals = computeTotals(lines, serviceEnabled);
  const hasItems = lines.length > 0;

  return (
    <div className="grid grid-cols-3 gap-1.5 border-t border-slate-200 p-2">
      <button
        type="button"
        disabled={!hasItems}
        onClick={() => {
          if (window.confirm("Clear the entire order?")) clearOrder();
        }}
        className="min-h-[52px] rounded-md bg-[var(--action-delete)] text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete
      </button>
      <button
        type="button"
        disabled={!hasItems}
        onClick={() =>
          window.alert(
            `Order held / sent to kitchen.\nItems: ${totals.itemCount}\nTotal: £${totals.total.toFixed(2)}`,
          )
        }
        className="min-h-[52px] rounded-md bg-[var(--action-order)] text-sm font-bold uppercase leading-tight tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Order
        <br />
        Layaway
      </button>
      <button
        type="button"
        disabled={!hasItems}
        onClick={() =>
          window.alert(
            `Payment screen coming next.\nAmount due: £${totals.due.toFixed(2)}`,
          )
        }
        className="min-h-[52px] rounded-md bg-[var(--action-pay)] text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Pay
      </button>
    </div>
  );
}

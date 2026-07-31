"use client";

import { useEffect, useRef } from "react";
import { formatMoney } from "@/lib/format";
import { usePosStore } from "@/store/pos-store";

export function OrderLineList() {
  const lines = usePosStore((state) => state.lines);
  const selectedLineId = usePosStore((state) => state.selectedLineId);
  const selectLine = usePosStore((state) => state.selectLine);
  const selectedRowRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedLineId, lines.length]);

  if (lines.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
        <div>
          <p className="text-base font-semibold text-slate-700">No items yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Tap a category, then add products to start an order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="sticky top-0 z-10 grid grid-cols-[1fr_40px_72px_72px] gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <span>Item</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Price</span>
        <span className="text-right">Total</span>
      </div>

      <ul>
        {lines.map((line) => {
          const selected = line.id === selectedLineId;
          const lineTotal = line.unitPrice * line.quantity - line.discountAmount;

          return (
            <li
              key={line.id}
              ref={selected ? selectedRowRef : undefined}
            >
              <button
                type="button"
                onClick={() => selectLine(line.id)}
                className={`grid w-full grid-cols-[1fr_40px_72px_72px] gap-1 px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? "bg-[var(--pos-selected)]"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {line.name}
                  </p>
                  {line.note && (
                    <p className="truncate text-xs italic text-slate-500">
                      Note: {line.note}
                    </p>
                  )}
                  {line.promotionLabel && (
                    <p className="truncate text-xs font-medium text-emerald-700">
                      {line.promotionLabel}
                    </p>
                  )}
                </div>
                <span className="text-center font-medium text-slate-800">
                  {line.quantity}
                </span>
                <span className="text-right text-slate-700">
                  {formatMoney(line.unitPrice)}
                </span>
                <span className="text-right font-semibold text-slate-900">
                  {line.discountAmount > 0 ? (
                    <span className="flex flex-col items-end leading-tight">
                      <span className="text-xs text-slate-400 line-through">
                        {formatMoney(line.unitPrice * line.quantity)}
                      </span>
                      <span>{formatMoney(lineTotal)}</span>
                    </span>
                  ) : (
                    formatMoney(lineTotal)
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

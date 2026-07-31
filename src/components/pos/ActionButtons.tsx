"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { computeTotals } from "@/lib/order-math";
import { PosDialog } from "@/components/pos/PosDialog";
import { usePosStore } from "@/store/pos-store";

export function ActionButtons() {
  const lines = usePosStore((state) => state.lines);
  const serviceEnabled = usePosStore((state) => state.serviceEnabled);
  const clearOrder = usePosStore((state) => state.clearOrder);
  const holdOrder = usePosStore((state) => state.holdOrder);
  const completePayment = usePosStore((state) => state.completePayment);
  const setStatusMessage = usePosStore((state) => state.setStatusMessage);
  const customerName = usePosStore((state) => state.customerName);
  const tableLabel = usePosStore((state) => state.tableLabel);

  const [confirmClear, setConfirmClear] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<"cash" | "card">("card");
  const [tendered, setTendered] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");

  const totals = computeTotals(lines, serviceEnabled);
  const hasItems = lines.length > 0;

  const change = useMemo(() => {
    const amount = Number.parseFloat(tendered);
    if (Number.isNaN(amount)) return 0;
    return Math.max(0, Math.round((amount - totals.due) * 100) / 100);
  }, [tendered, totals.due]);

  function openPay() {
    setMethod("card");
    setTendered(totals.due.toFixed(2));
    setError("");
    setReceipt("");
    setPayOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 border-t border-slate-200 p-2">
        <button
          type="button"
          disabled={!hasItems}
          onClick={() => setConfirmClear(true)}
          className="min-h-12 rounded-md bg-[var(--action-delete)] text-xs font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[52px] sm:text-sm"
        >
          Delete
        </button>
        <button
          type="button"
          disabled={!hasItems}
          onClick={() => {
            const result = holdOrder();
            if (!result.ok) setStatusMessage(result.error);
          }}
          className="min-h-12 rounded-md bg-[var(--action-order)] text-xs font-bold uppercase leading-tight tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[52px] sm:text-sm"
        >
          Order
          <br />
          Layaway
        </button>
        <button
          type="button"
          disabled={!hasItems}
          onClick={openPay}
          className="min-h-12 rounded-md bg-[var(--action-pay)] text-xs font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[52px] sm:text-sm"
        >
          Pay
        </button>
      </div>

      <PosDialog
        open={confirmClear}
        title="Clear order?"
        onClose={() => setConfirmClear(false)}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="min-h-11 rounded-md border border-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                clearOrder();
                setConfirmClear(false);
              }}
              className="min-h-11 rounded-md bg-[var(--action-delete)] text-sm font-semibold text-white"
            >
              Clear ticket
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          This removes all {totals.itemCount} item
          {totals.itemCount === 1 ? "" : "s"} from the current ticket.
        </p>
      </PosDialog>

      <PosDialog
        open={payOpen}
        title={receipt ? "Payment complete" : "Take payment"}
        onClose={() => setPayOpen(false)}
        footer={
          receipt ? (
            <button
              type="button"
              onClick={() => setPayOpen(false)}
              className="min-h-11 w-full rounded-md bg-[var(--action-pay)] text-sm font-semibold text-white"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const amount = Number.parseFloat(tendered);
                if (Number.isNaN(amount)) {
                  setError("Enter a valid amount.");
                  return;
                }
                const result = completePayment({
                  method,
                  amountTendered: amount,
                  change: 0,
                });
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setReceipt(result.receipt);
              }}
              className="min-h-11 w-full rounded-md bg-[var(--action-pay)] text-sm font-semibold text-white"
            >
              Complete {formatMoney(totals.due)}
            </button>
          )
        }
      >
        {receipt ? (
          <pre className="overflow-auto rounded-md bg-slate-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {receipt}
          </pre>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Amount due
              </p>
              <p className="text-2xl font-black">{formatMoney(totals.due)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {[customerName, tableLabel].filter(Boolean).join(" · ") ||
                  "Walk-in"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["card", "cash"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setMethod(option);
                    setTendered(totals.due.toFixed(2));
                    setError("");
                  }}
                  className={`min-h-11 rounded-md text-sm font-semibold capitalize ${
                    method === option
                      ? "bg-[var(--pos-header)] text-white"
                      : "border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {method === "cash" ? (
              <>
                <label className="block text-sm font-semibold">
                  Cash tendered (£)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tendered}
                    onChange={(event) => setTendered(event.target.value)}
                    className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
                  />
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[totals.due, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setTendered(
                          Math.max(amount, totals.due).toFixed(2),
                        )
                      }
                      className="min-h-10 rounded-md border border-slate-300 text-xs font-bold hover:bg-slate-50"
                    >
                      {formatMoney(Math.max(amount, totals.due))}
                    </button>
                  ))}
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Change {formatMoney(change)}
                </p>
              </>
            ) : null}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        )}
      </PosDialog>
    </>
  );
}

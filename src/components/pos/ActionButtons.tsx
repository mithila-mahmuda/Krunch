"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { computeTotals } from "@/lib/order-math";
import { can } from "@/lib/permissions";
import { printReceiptText } from "@/lib/print-receipt";
import { PosDialog } from "@/components/pos/PosDialog";
import { ReceiptTicket } from "@/components/receipt/ReceiptTicket";
import { useAuthStore } from "@/store/auth-store";
import { usePosStore } from "@/store/pos-store";

export function ActionButtons() {
  const role = useAuthStore((state) => state.user?.role);
  const lines = usePosStore((state) => state.lines);
  const serviceEnabled = usePosStore((state) => state.serviceEnabled);
  const editingOrderId = usePosStore((state) => state.editingOrderId);
  const clearOrder = usePosStore((state) => state.clearOrder);
  const holdOrder = usePosStore((state) => state.holdOrder);
  const fireOrder = usePosStore((state) => state.fireOrder);
  const voidOrder = usePosStore((state) => state.voidOrder);
  const completePayment = usePosStore((state) => state.completePayment);
  const setStatusMessage = usePosStore((state) => state.setStatusMessage);
  const customerName = usePosStore((state) => state.customerName);
  const tableLabel = usePosStore((state) => state.tableLabel);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<"cash" | "card">("card");
  const [amountPaid, setAmountPaid] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");

  const totals = computeTotals(lines, serviceEnabled);
  const hasItems = lines.length > 0;
  const canVoid =
    can(role, "void_order") && (Boolean(editingOrderId) || hasItems);

  const change = useMemo(() => {
    const amount = Number.parseFloat(amountPaid);
    if (Number.isNaN(amount)) return 0;
    return Math.max(0, Math.round((amount - totals.due) * 100) / 100);
  }, [amountPaid, totals.due]);

  function openPay() {
    setMethod("card");
    setAmountPaid(totals.due.toFixed(2));
    setError("");
    setReceipt("");
    setPayOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-1 border-t border-slate-200 p-1.5 sm:grid-cols-5">
        <button
          type="button"
          disabled={!hasItems}
          onClick={() => setConfirmClear(true)}
          className="min-h-10 rounded-md bg-[var(--action-delete)] text-[11px] font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
        <button
          type="button"
          disabled={!canVoid}
          onClick={() => setConfirmVoid(true)}
          className="min-h-10 rounded-md border border-rose-300 bg-white text-[11px] font-bold uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Void
        </button>
        <button
          type="button"
          disabled={!hasItems}
          onClick={() => {
            const result = holdOrder();
            if (!result.ok) setStatusMessage(result.error);
          }}
          className="min-h-10 rounded-md bg-[var(--action-order)] text-[11px] font-bold uppercase leading-tight tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Hold
        </button>
        <button
          type="button"
          disabled={!hasItems}
          onClick={() => {
            const result = fireOrder();
            if (!result.ok) setStatusMessage(result.error);
          }}
          className="min-h-10 rounded-md bg-amber-600 text-[11px] font-bold uppercase leading-tight tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
          <br />
          Kitchen
        </button>
        <button
          type="button"
          disabled={!hasItems}
          onClick={openPay}
          className="min-h-10 rounded-md bg-[var(--action-pay)] text-[11px] font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
          {editingOrderId
            ? " The saved order stays open — use Void to cancel it."
            : ""}
        </p>
      </PosDialog>

      <PosDialog
        open={confirmVoid}
        title="Void order?"
        onClose={() => setConfirmVoid(false)}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmVoid(false)}
              className="min-h-11 rounded-md border border-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const result = voidOrder();
                setConfirmVoid(false);
                if (!result.ok) {
                  setStatusMessage(result.error);
                  return;
                }
                setStatusMessage("Order voided");
              }}
              className="min-h-11 rounded-md bg-rose-600 text-sm font-semibold text-white"
            >
              Void order
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          {editingOrderId
            ? "Cancels this open order, removes it from the kitchen board, and clears the till."
            : "Cancels this ticket and records it as voided. No need to hold first."}{" "}
          This cannot be undone.
        </p>
      </PosDialog>

      <PosDialog
        open={payOpen}
        title={receipt ? "Payment complete" : "Take payment"}
        onClose={() => setPayOpen(false)}
        footer={
          receipt ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  printReceiptText(receipt);
                }}
                className="min-h-11 rounded-md border border-slate-300 text-sm font-semibold"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="min-h-11 rounded-md bg-[var(--action-pay)] text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const amount = Number.parseFloat(amountPaid);
                if (Number.isNaN(amount)) {
                  setError("Enter a valid amount.");
                  return;
                }
                const result = completePayment({
                  method,
                  amountPaid: amount,
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
          <ReceiptTicket receipt={receipt} />
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
              {(["card", "cash"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMethod(item);
                    if (item === "card") {
                      setAmountPaid(totals.due.toFixed(2));
                    }
                  }}
                  className={`min-h-11 rounded-md text-sm font-semibold capitalize ${
                    method === item
                      ? "bg-[var(--pos-header)] text-pos-on-header"
                      : "border border-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Amount paid
              <input
                type="number"
                min={0}
                step={0.01}
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
              />
            </label>

            {method === "cash" && change > 0 ? (
              <p className="text-sm font-semibold text-emerald-700">
                Change {formatMoney(change)}
              </p>
            ) : null}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        )}
      </PosDialog>
    </>
  );
}

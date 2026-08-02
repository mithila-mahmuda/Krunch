"use client";

import { useState, type ReactNode } from "react";
import {
  Banknote,
  CirclePlus,
  Printer,
  RefreshCw,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { DiningOption } from "@/lib/types";
import { PosDialog } from "@/components/pos/PosDialog";
import { usePosStore } from "@/store/pos-store";

const diningLabels: Record<DiningOption, string> = {
  eat_in: "Eat In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

const diningOrder: DiningOption[] = ["eat_in", "takeaway", "delivery"];

export function UtilityButtons() {
  const diningOption = usePosStore((state) => state.diningOption);
  const setDiningOption = usePosStore((state) => state.setDiningOption);
  const addMiscProduct = usePosStore((state) => state.addMiscProduct);
  const printReceipt = usePosStore((state) => state.printReceipt);
  const openCashDrawer = usePosStore((state) => state.openCashDrawer);
  const recordPettyCash = usePosStore((state) => state.recordPettyCash);
  const adjustFloat = usePosStore((state) => state.adjustFloat);
  const floatAmount = usePosStore((state) => state.floatAmount);
  const lastReceipt = usePosStore((state) => state.lastReceipt);

  const [miscOpen, setMiscOpen] = useState(false);
  const [pettyOpen, setPettyOpen] = useState(false);
  const [floatOpen, setFloatOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptText, setReceiptText] = useState("");
  const [miscName, setMiscName] = useState("");
  const [miscPrice, setMiscPrice] = useState("");
  const [pettyAmount, setPettyAmount] = useState("");
  const [pettyReason, setPettyReason] = useState("");
  const [floatValue, setFloatValue] = useState("");
  const [error, setError] = useState("");

  const cycleDining = () => {
    const index = diningOrder.indexOf(diningOption);
    const next = diningOrder[(index + 1) % diningOrder.length];
    setDiningOption(next);
  };

  const buttons: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    accent?: boolean;
  }[] = [
    {
      label: "Misc Product",
      icon: <CirclePlus className="h-4 w-4" strokeWidth={1.75} />,
      onClick: () => {
        setError("");
        setMiscName("");
        setMiscPrice("");
        setMiscOpen(true);
      },
    },
    {
      label: "Print",
      icon: <Printer className="h-4 w-4" strokeWidth={1.75} />,
      onClick: () => {
        const result = printReceipt();
        if (!result.ok) {
          setError(result.error);
          setReceiptOpen(true);
          setReceiptText("");
          return;
        }
        setError("");
        setReceiptText(result.receipt);
        setReceiptOpen(true);
      },
    },
    {
      label: "No Sale",
      icon: <Banknote className="h-4 w-4" strokeWidth={1.75} />,
      onClick: () => openCashDrawer("No sale"),
    },
    {
      label: "Petty Cash",
      icon: <Wallet className="h-4 w-4" strokeWidth={1.75} />,
      onClick: () => {
        setError("");
        setPettyAmount("");
        setPettyReason("");
        setPettyOpen(true);
      },
    },
    {
      label: "Adjust Float",
      icon: <RefreshCw className="h-4 w-4" strokeWidth={1.75} />,
      onClick: () => {
        setError("");
        setFloatValue(String(floatAmount));
        setFloatOpen(true);
      },
    },
    {
      label: `Dining Option\n${diningLabels[diningOption]}`,
      icon: <UtensilsCrossed className="h-4 w-4" strokeWidth={1.75} />,
      onClick: cycleDining,
      accent: true,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-1 border-t border-slate-200 bg-slate-50 px-1.5 py-1.5">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={button.onClick}
            className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-md border px-1 py-1 text-[9px] font-bold uppercase leading-tight tracking-wide whitespace-pre-line transition active:scale-[0.98] ${
              button.accent
                ? "border-[var(--pos-selected)] bg-white text-[var(--pos-selected-deep)]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {button.icon}
            <span>{button.label}</span>
          </button>
        ))}
      </div>

      <PosDialog
        open={miscOpen}
        title="Misc product"
        onClose={() => setMiscOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              const price = Number.parseFloat(miscPrice);
              if (!miscName.trim() || Number.isNaN(price) || price <= 0) {
                setError("Enter a name and price greater than 0.");
                return;
              }
              addMiscProduct(miscName, price);
              setMiscOpen(false);
            }}
            className="min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white"
          >
            Add to ticket
          </button>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-semibold">
            Name
            <input
              value={miscName}
              onChange={(event) => setMiscName(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
              placeholder="e.g. Corkage"
            />
          </label>
          <label className="block text-sm font-semibold">
            Price (£)
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={miscPrice}
              onChange={(event) => setMiscPrice(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      </PosDialog>

      <PosDialog
        open={pettyOpen}
        title="Petty cash"
        onClose={() => setPettyOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              const amount = Number.parseFloat(pettyAmount);
              const result = recordPettyCash(amount, pettyReason);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setPettyOpen(false);
            }}
            className="min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white"
          >
            Record withdrawal
          </button>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Current float {formatMoney(floatAmount)}
        </p>
        <div className="space-y-3">
          <label className="block text-sm font-semibold">
            Amount (£)
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={pettyAmount}
              onChange={(event) => setPettyAmount(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Reason
            <input
              value={pettyReason}
              onChange={(event) => setPettyReason(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
              placeholder="e.g. Milk run"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      </PosDialog>

      <PosDialog
        open={floatOpen}
        title="Adjust float"
        onClose={() => setFloatOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              const amount = Number.parseFloat(floatValue);
              const result = adjustFloat(amount);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setFloatOpen(false);
            }}
            className="min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white"
          >
            Save float
          </button>
        }
      >
        <label className="block text-sm font-semibold">
          Float amount (£)
          <input
            type="number"
            min={0}
            step={0.01}
            value={floatValue}
            onChange={(event) => setFloatValue(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
          />
        </label>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </PosDialog>

      <PosDialog
        open={receiptOpen}
        title="Receipt"
        onClose={() => setReceiptOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setReceiptOpen(false)}
            className="min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white"
          >
            Done
          </button>
        }
      >
        {error && !receiptText ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <pre className="overflow-auto rounded-md bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
            {receiptText || lastReceipt}
          </pre>
        )}
      </PosDialog>
    </>
  );
}

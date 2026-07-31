"use client";

import { useState } from "react";
import { Minus, Plus, StickyNote, Tag, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { PosDialog } from "@/components/pos/PosDialog";
import { usePosStore } from "@/store/pos-store";

type DiscountMode = "amount" | "percent";

export function ItemControls() {
  const selectedLineId = usePosStore((state) => state.selectedLineId);
  const lines = usePosStore((state) => state.lines);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeLine = usePosStore((state) => state.removeLine);
  const setLineNote = usePosStore((state) => state.setLineNote);
  const applyLineDiscount = usePosStore((state) => state.applyLineDiscount);

  const [noteOpen, setNoteOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("amount");
  const [discountValue, setDiscountValue] = useState("");

  const selectedLine = lines.find((line) => line.id === selectedLineId);

  if (!selectedLine) {
    return (
      <div className="h-12 shrink-0 border-t border-slate-200 bg-slate-50 sm:h-14" />
    );
  }

  const selected = selectedLine;
  const lineTotal = selected.unitPrice * selected.quantity;
  const maxDiscount = lineTotal;

  const previewAmount = (() => {
    const value = Number.parseFloat(discountValue);
    if (Number.isNaN(value) || value < 0) return 0;
    if (discountMode === "percent") {
      return Math.min(lineTotal, Math.round(lineTotal * (value / 100) * 100) / 100);
    }
    return Math.min(lineTotal, value);
  })();

  function openDiscount() {
    if (selected.manualDiscountAmount > 0 && lineTotal > 0) {
      const asPercent =
        Math.round((selected.manualDiscountAmount / lineTotal) * 1000) / 10;
      setDiscountMode("percent");
      setDiscountValue(String(asPercent));
    } else {
      setDiscountMode("amount");
      setDiscountValue("");
    }
    setDiscountOpen(true);
  }

  function applyDiscount() {
    const value = Number.parseFloat(discountValue);
    if (Number.isNaN(value) || value < 0) return;

    if (discountMode === "percent") {
      const percent = Math.min(100, value);
      const amount =
        Math.round(lineTotal * (percent / 100) * 100) / 100;
      applyLineDiscount(selected.id, amount, {
        mode: "percent",
        percent,
      });
    } else {
      applyLineDiscount(selected.id, value, { mode: "amount" });
    }
    setDiscountOpen(false);
  }

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-1.5 border-t border-slate-200 bg-slate-50 px-2 sm:h-14 sm:gap-2 sm:px-3">
        <button
          type="button"
          onClick={() => {
            setNoteValue(selected.note ?? "");
            setNoteOpen(true);
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-md border transition active:scale-95 ${
            selected.note
              ? "border-[var(--pos-accent)] bg-[var(--pos-accent-soft)] text-[var(--pos-accent)]"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
          aria-label="Add note"
          title="Note"
        >
          <StickyNote className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={openDiscount}
          className={`flex h-10 w-10 items-center justify-center rounded-md border transition active:scale-95 ${
            selected.manualDiscountAmount > 0
              ? "border-[var(--pos-accent)] bg-[var(--pos-accent-soft)] text-[var(--pos-accent)]"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
          aria-label="Apply discount"
          title="Discount"
        >
          <Tag className="h-5 w-5" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuantity(selected.id, -1)}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--pos-accent)] text-white transition hover:brightness-110 active:scale-95"
            aria-label="Decrease quantity"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="w-8 text-center text-lg font-bold text-slate-900">
            {selected.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(selected.id, 1)}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--pos-accent)] text-white transition hover:brightness-110 active:scale-95"
            aria-label="Increase quantity"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => removeLine(selected.id)}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--action-delete)] text-white transition hover:brightness-110 active:scale-95"
            aria-label="Remove item"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <PosDialog
        open={noteOpen}
        title={`Note · ${selected.name}`}
        onClose={() => setNoteOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setLineNote(selected.id, "");
                setNoteOpen(false);
              }}
              className="min-h-11 rounded-md border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setLineNote(selected.id, noteValue);
                setNoteOpen(false);
              }}
              className="min-h-11 rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white hover:brightness-110"
            >
              Save note
            </button>
          </div>
        }
      >
        <p className="mb-2 text-sm text-slate-500">
          Kitchen / bar instruction for this line.
        </p>
        <textarea
          value={noteValue}
          onChange={(event) => setNoteValue(event.target.value)}
          rows={4}
          autoFocus
          placeholder="e.g. No onions, extra hot"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
      </PosDialog>

      <PosDialog
        open={discountOpen}
        title={`Discount · ${selected.name}`}
        onClose={() => setDiscountOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                applyLineDiscount(selected.id, 0);
                setDiscountOpen(false);
              }}
              className="min-h-11 rounded-md border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={applyDiscount}
              className="min-h-11 rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white hover:brightness-110"
            >
              Apply
            </button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Line total {formatMoney(lineTotal)}. Max discount{" "}
          {formatMoney(maxDiscount)}.
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setDiscountMode("amount");
              setDiscountValue("");
            }}
            className={`min-h-10 rounded-md text-sm font-semibold ${
              discountMode === "amount"
                ? "bg-[var(--pos-header)] text-white"
                : "border border-slate-300 hover:bg-slate-50"
            }`}
          >
            £ Amount
          </button>
          <button
            type="button"
            onClick={() => {
              setDiscountMode("percent");
              setDiscountValue("");
            }}
            className={`min-h-10 rounded-md text-sm font-semibold ${
              discountMode === "percent"
                ? "bg-[var(--pos-header)] text-white"
                : "border border-slate-300 hover:bg-slate-50"
            }`}
          >
            % Percent
          </button>
        </div>

        <label className="block text-sm font-semibold">
          {discountMode === "percent" ? "Percent (%)" : "Amount (£)"}
          <input
            type="number"
            min={0}
            step={discountMode === "percent" ? 1 : 0.01}
            max={discountMode === "percent" ? 100 : maxDiscount}
            value={discountValue}
            onChange={(event) => setDiscountValue(event.target.value)}
            autoFocus
            className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
          />
        </label>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {(discountMode === "percent" ? [5, 10, 20, 50] : [1, 2, 5, 10]).map(
            (preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setDiscountValue(
                    String(
                      discountMode === "percent"
                        ? preset
                        : Math.min(preset, maxDiscount),
                    ),
                  )
                }
                className="min-h-10 rounded-md border border-slate-300 text-sm font-semibold hover:bg-slate-50"
              >
                {discountMode === "percent" ? `${preset}%` : `£${preset}`}
              </button>
            ),
          )}
        </div>

        {previewAmount > 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Discount {formatMoney(previewAmount)}
            {discountMode === "percent" && discountValue
              ? ` (${discountValue}%)`
              : ""}
          </p>
        ) : null}
      </PosDialog>
    </>
  );
}

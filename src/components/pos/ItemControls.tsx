"use client";

import { Minus, Plus, StickyNote, Tag, X } from "lucide-react";
import { usePosStore } from "@/store/pos-store";

export function ItemControls() {
  const selectedLineId = usePosStore((state) => state.selectedLineId);
  const lines = usePosStore((state) => state.lines);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeLine = usePosStore((state) => state.removeLine);
  const setLineNote = usePosStore((state) => state.setLineNote);
  const applyLineDiscount = usePosStore((state) => state.applyLineDiscount);

  const selected = lines.find((line) => line.id === selectedLineId);

  if (!selected) {
    return <div className="h-12 shrink-0 border-t border-slate-200 bg-slate-50 sm:h-14" />;
  }

  return (
    <div className="flex h-12 shrink-0 items-center gap-1.5 border-t border-slate-200 bg-slate-50 px-2 sm:h-14 sm:gap-2 sm:px-3">
      <button
        type="button"
        onClick={() => {
          const note = window.prompt("Add a kitchen note", selected.note ?? "");
          if (note !== null) setLineNote(selected.id, note);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 active:scale-95"
        aria-label="Add note"
        title="Note"
      >
        <StickyNote className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => {
          const value = window.prompt("Discount amount (£)", "1.00");
          if (value === null) return;
          const amount = Number.parseFloat(value);
          if (!Number.isNaN(amount)) applyLineDiscount(selected.id, amount);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 active:scale-95"
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
  );
}

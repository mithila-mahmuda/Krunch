"use client";

import { usePosStore } from "@/store/pos-store";
import type { DiningOption } from "@/lib/types";

const diningLabels: Record<DiningOption, string> = {
  eat_in: "Eat In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

const diningOrder: DiningOption[] = ["eat_in", "takeaway", "delivery"];

export function UtilityButtons() {
  const diningOption = usePosStore((state) => state.diningOption);
  const setDiningOption = usePosStore((state) => state.setDiningOption);

  const cycleDining = () => {
    const index = diningOrder.indexOf(diningOption);
    const next = diningOrder[(index + 1) % diningOrder.length];
    setDiningOption(next);
  };

  const buttons = [
    { label: "Misc Product", onClick: () => window.alert("Misc product — coming soon") },
    { label: "Print", onClick: () => window.alert("Print receipt — coming soon") },
    { label: "No Sale", onClick: () => window.alert("No sale drawer open — coming soon") },
    { label: "Petty Cash", onClick: () => window.alert("Petty cash — coming soon") },
    { label: "Adjust Float", onClick: () => window.alert("Adjust float — coming soon") },
    {
      label: `Dining Option\n${diningLabels[diningOption]}`,
      onClick: cycleDining,
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 border-t border-slate-200 px-2 py-2 min-[400px]:grid-cols-3">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={button.onClick}
          className={`min-h-11 rounded-md border px-1.5 py-1.5 text-[10px] font-bold uppercase leading-tight tracking-wide whitespace-pre-line transition active:scale-[0.98] sm:min-h-[44px] ${
            button.accent
              ? "border-[var(--pos-accent)] bg-[var(--pos-accent-soft)] text-[var(--pos-accent)]"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}

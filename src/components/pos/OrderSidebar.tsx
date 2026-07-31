"use client";

import {
  ClipboardList,
  LayoutGrid,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { SidebarTab } from "@/lib/types";
import { usePosStore } from "@/store/pos-store";
import { ActionButtons } from "@/components/pos/ActionButtons";
import { ItemControls } from "@/components/pos/ItemControls";
import { OrderLineList } from "@/components/pos/OrderLineList";
import { OrderTotals } from "@/components/pos/OrderTotals";
import { UtilityButtons } from "@/components/pos/UtilityButtons";

const tabs: { id: SidebarTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "menu", label: "Menu", icon: LayoutGrid },
  { id: "customers", label: "Customers", icon: Users },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "tables", label: "Tabs & Tables", icon: UtensilsCrossed },
];

export function OrderSidebar() {
  const activeTab = usePosStore((state) => state.activeTab);
  const setActiveTab = usePosStore((state) => state.setActiveTab);

  return (
    <aside className="flex h-full w-[min(100%,420px)] shrink-0 flex-col border-l border-slate-200 bg-white text-slate-900">
      <div className="grid grid-cols-4 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-semibold uppercase tracking-wide transition ${
                active
                  ? "border-b-2 border-[var(--pos-accent)] text-[var(--pos-accent)]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "menu" ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col">
            <OrderLineList />
            <ItemControls />
          </div>
          <div className="shrink-0">
            <OrderTotals />
            <UtilityButtons />
            <ActionButtons />
          </div>
        </>
      ) : (
        <PlaceholderPanel tab={activeTab} />
      )}
    </aside>
  );
}

function PlaceholderPanel({
  tab,
}: {
  tab: Exclude<SidebarTab, "menu">;
}) {
  const copy: Record<Exclude<SidebarTab, "menu">, string> = {
    customers: "Look up loyalty members and attach guests to this ticket.",
    orders: "Recall open tickets, layaways, and recent completed sales.",
    tables: "Assign this order to a table or open tab.",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="text-lg font-bold capitalize text-slate-800">{tab}</p>
      <p className="text-sm text-slate-500">{copy[tab]}</p>
      <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
        Coming in the next build phase
      </p>
    </div>
  );
}

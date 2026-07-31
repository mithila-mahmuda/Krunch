"use client";

import { useEffect, useRef } from "react";
import {
  ClipboardList,
  LayoutGrid,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { SidebarTab } from "@/lib/types";
import { usePosStore } from "@/store/pos-store";
import { ActionButtons } from "@/components/pos/ActionButtons";
import { ItemControls } from "@/components/pos/ItemControls";
import { OrderLineList } from "@/components/pos/OrderLineList";
import { OrderTotals } from "@/components/pos/OrderTotals";
import { UtilityButtons } from "@/components/pos/UtilityButtons";

const tabs: { id: SidebarTab; label: string; shortLabel: string; icon: typeof LayoutGrid }[] = [
  { id: "menu", label: "Menu", shortLabel: "Menu", icon: LayoutGrid },
  { id: "customers", label: "Customers", shortLabel: "Guests", icon: Users },
  { id: "orders", label: "Orders", shortLabel: "Orders", icon: ClipboardList },
  { id: "tables", label: "Tabs & Tables", shortLabel: "Tables", icon: UtensilsCrossed },
];

export function OrderSidebar() {
  const activeTab = usePosStore((state) => state.activeTab);
  const setActiveTab = usePosStore((state) => state.setActiveTab);
  const orderPanelOpen = usePosStore((state) => state.orderPanelOpen);
  const setOrderPanelOpen = usePosStore((state) => state.setOrderPanelOpen);
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = asideRef.current;
    if (!el) return;

    const media = window.matchMedia("(min-width: 1024px)");

    function syncInert() {
      if (!el) return;
      if (media.matches || orderPanelOpen) {
        el.removeAttribute("inert");
      } else {
        el.setAttribute("inert", "");
      }
    }

    syncInert();
    media.addEventListener("change", syncInert);
    return () => media.removeEventListener("change", syncInert);
  }, [orderPanelOpen]);

  useEffect(() => {
    if (!orderPanelOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOrderPanelOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [orderPanelOpen, setOrderPanelOpen]);

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-black/45 transition-opacity lg:hidden ${
          orderPanelOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-label="Close order panel"
        tabIndex={orderPanelOpen ? 0 : -1}
        onClick={() => setOrderPanelOpen(false)}
      />

      <aside
        ref={asideRef}
        className={`fixed inset-x-0 bottom-0 z-40 flex max-h-[min(92dvh,100%)] w-full flex-col rounded-t-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl transition-transform duration-200 ease-out @container ${
          orderPanelOpen ? "translate-y-0" : "translate-y-full"
        } lg:static lg:z-auto lg:h-full lg:max-h-none lg:w-[min(100%,420px)] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-0 lg:border-l lg:shadow-none`}
        aria-label="Order panel"
      >
        <div className="shrink-0 border-b border-slate-200 px-3 pb-2.5 pt-2 lg:hidden">
          <div className="mb-2 flex justify-center">
            <span className="h-1 w-10 rounded-full bg-slate-300" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-900">Current order</p>
            <button
              type="button"
              onClick={() => setOrderPanelOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50 active:scale-95"
              aria-label="Close order panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-4 border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition sm:text-[11px] ${
                  active
                    ? "border-b-2 border-[var(--pos-accent)] text-[var(--pos-accent)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate sm:hidden">{tab.shortLabel}</span>
                <span className="hidden truncate sm:inline">{tab.label}</span>
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
            <div className="shrink-0 overflow-y-auto overscroll-contain pb-[max(0px,env(safe-area-inset-bottom))]">
              <OrderTotals />
              <UtilityButtons />
              <ActionButtons />
            </div>
          </>
        ) : (
          <PlaceholderPanel tab={activeTab} />
        )}
      </aside>
    </>
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
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center sm:px-8">
      <p className="text-lg font-bold capitalize text-slate-800">{tab}</p>
      <p className="text-sm text-slate-500">{copy[tab]}</p>
      <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
        Coming in the next build phase
      </p>
    </div>
  );
}

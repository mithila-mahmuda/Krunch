"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Monitor,
  Plus,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { INITIAL_ORDERS, INITIAL_TABLES } from "@/lib/module-data";
import type { SidebarTab } from "@/lib/types";
import { useCustomerStore } from "@/store/customer-store";
import { usePosStore } from "@/store/pos-store";
import { ActionButtons } from "@/components/pos/ActionButtons";
import { OrderLineList } from "@/components/pos/OrderLineList";
import { OrderTotals } from "@/components/pos/OrderTotals";
import { PosDialog } from "@/components/pos/PosDialog";
import { UtilityButtons } from "@/components/pos/UtilityButtons";

const tabs: {
  id: SidebarTab;
  label: string;
  icon: typeof Monitor;
}[] = [
  { id: "menu", label: "Menu", icon: Monitor },
  { id: "customers", label: "Customers", icon: Users },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "tables", label: "Tabs & Tables", icon: UtensilsCrossed },
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
      if (event.key !== "Escape") return;
      if (document.querySelector('[role="dialog"]')) return;
      setOrderPanelOpen(false);
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
        className={`pos-light-scroll fixed inset-x-0 bottom-0 z-40 flex max-h-[min(92dvh,100%)] w-full flex-col rounded-t-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl transition-transform duration-200 ease-out @container ${
          orderPanelOpen ? "translate-y-0" : "translate-y-full"
        } lg:static lg:z-auto lg:h-full lg:max-h-none lg:w-[min(100%,400px)] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-0 lg:border-l lg:shadow-none`}
        aria-label="Order panel"
      >
        <div className="shrink-0 border-b border-slate-200 px-3 pb-2 pt-2 lg:hidden">
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

        <TicketContextBar />

        <div className="grid shrink-0 grid-cols-4 border-b border-slate-200 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-bold uppercase tracking-wide transition ${
                  active
                    ? "border-b-2 border-[var(--pos-selected)] text-[var(--pos-selected-deep)]"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "menu" ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              <OrderLineList />
            </div>
            <div className="shrink-0 overflow-y-auto overscroll-contain pb-[max(0px,env(safe-area-inset-bottom))]">
              <OrderTotals />
              <UtilityButtons />
              <ActionButtons />
            </div>
          </>
        ) : activeTab === "customers" ? (
          <CustomersQuickPanel />
        ) : activeTab === "orders" ? (
          <OrdersQuickPanel />
        ) : (
          <TablesQuickPanel />
        )}
      </aside>
    </>
  );
}

function TicketContextBar() {
  const customerName = usePosStore((state) => state.customerName);
  const tableLabel = usePosStore((state) => state.tableLabel);
  const diningOption = usePosStore((state) => state.diningOption);

  if (!customerName && !tableLabel) return null;

  return (
    <div className="shrink-0 truncate border-b border-slate-100 bg-[var(--pos-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pos-accent)]">
      {[
        customerName ? `Guest: ${customerName}` : null,
        tableLabel ? `Table ${tableLabel}` : null,
        diningOption.replace("_", " "),
      ]
        .filter(Boolean)
        .join(" · ")}
    </div>
  );
}

function PanelFooter({ href, label }: { href: string; label: string }) {
  return (
    <div className="shrink-0 border-t border-slate-200 p-3">
      <Link
        href={href}
        className="flex min-h-11 items-center justify-center rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white hover:brightness-110"
      >
        {label}
      </Link>
    </div>
  );
}

function CustomersQuickPanel() {
  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const customerId = usePosStore((state) => state.customerId);
  const attachCustomer = usePosStore((state) => state.attachCustomer);
  const setActiveTab = usePosStore((state) => state.setActiveTab);

  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(q) ||
          customer.phone.includes(q) ||
          customer.email.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [customers, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2 border-b border-slate-100 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">Attach a guest</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setName("");
              setEmail("");
              setPhone("");
              setNotes("");
              setAddOpen(true);
            }}
            className="inline-flex min-h-9 items-center gap-1 rounded-md bg-[var(--pos-header)] px-2.5 text-xs font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search guests"
          className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
        {filtered.map((customer) => {
          const attached = customerId === customer.id;
          return (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => {
                  if (attached) {
                    attachCustomer(null);
                  } else {
                    attachCustomer({ id: customer.id, name: customer.name });
                    setActiveTab("menu");
                  }
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition ${
                  attached
                    ? "bg-[var(--pos-accent-soft)] text-[var(--pos-accent)]"
                    : "hover:bg-slate-50"
                }`}
              >
                <span>
                  <span className="block font-semibold">{customer.name}</span>
                  <span className="text-xs text-slate-500">
                    {customer.loyaltyPoints} pts · {customer.phone}
                  </span>
                </span>
                <span className="text-xs font-bold uppercase">
                  {attached ? "Linked" : "Attach"}
                </span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="px-3 py-8 text-center text-sm text-slate-500">
            No guests found. Add a new customer.
          </li>
        ) : null}
      </ul>
      <PanelFooter href="/customers" label="Open Customers" />

      <PosDialog
        open={addOpen}
        title="Add customer"
        onClose={() => setAddOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              const result = addCustomer({ name, email, phone, notes });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              attachCustomer({
                id: result.customer.id,
                name: result.customer.name,
              });
              setAddOpen(false);
              setActiveTab("menu");
            }}
            className="min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white"
          >
            Save & attach
          </button>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-semibold">
            Name *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
              autoFocus
            />
          </label>
          <label className="block text-sm font-semibold">
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Notes
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
              placeholder="Allergies, preferences"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      </PosDialog>
    </div>
  );
}

function OrdersQuickPanel() {
  const heldOrders = usePosStore((state) => state.heldOrders);
  const completedOrders = usePosStore((state) => state.completedOrders);
  const recallOrder = usePosStore((state) => state.recallOrder);
  const setStatusMessage = usePosStore((state) => state.setStatusMessage);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptText, setReceiptText] = useState("");

  const demoOpen = INITIAL_ORDERS.filter(
    (order) =>
      order.status === "open" ||
      order.status === "preparing" ||
      order.status === "ready",
  ).slice(0, 4);

  const hasAny =
    heldOrders.length > 0 ||
    completedOrders.length > 0 ||
    demoOpen.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-slate-100 p-3">
        <p className="text-sm font-bold text-slate-900">Orders</p>
        <p className="text-xs text-slate-500">
          Held layaways and completed payments
        </p>
      </div>
      <ul className="min-h-0 flex-1 space-y-3 overflow-auto p-2">
        {heldOrders.length > 0 ? (
          <li className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Held
            </p>
            {heldOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  const result = recallOrder(order.id);
                  if (!result.ok) setStatusMessage(result.error);
                }}
                className="w-full rounded-md border border-[var(--pos-accent)] bg-[var(--pos-accent-soft)] px-3 py-2.5 text-left text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {order.number}
                    {order.tableLabel ? (
                      <span className="ml-1 text-slate-500">
                        {order.tableLabel}
                      </span>
                    ) : null}
                  </p>
                  <p className="font-bold">{formatMoney(order.total)}</p>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  Held {order.heldAt}
                  {order.customerName ? ` · ${order.customerName}` : ""} · Tap
                  to recall
                </p>
              </button>
            ))}
          </li>
        ) : null}

        {completedOrders.length > 0 ? (
          <li className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Completed
            </p>
            {completedOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setReceiptText(order.receipt);
                  setReceiptOpen(true);
                }}
                className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {order.number}
                    {order.tableLabel ? (
                      <span className="ml-1 text-slate-500">
                        {order.tableLabel}
                      </span>
                    ) : null}
                  </p>
                  <p className="font-bold">{formatMoney(order.total)}</p>
                </div>
                <p className="mt-0.5 text-xs capitalize text-emerald-800">
                  Paid {order.paidAt} · {order.method}
                  {order.customerName ? ` · ${order.customerName}` : ""}
                </p>
              </button>
            ))}
          </li>
        ) : null}

        {demoOpen.length > 0 ? (
          <li className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Kitchen board
            </p>
            {demoOpen.map((order) => (
              <div
                key={order.id}
                className="rounded-md border border-slate-200 px-3 py-2.5 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {order.number}
                    {order.table ? (
                      <span className="ml-1 text-slate-500">{order.table}</span>
                    ) : null}
                  </p>
                  <p className="font-bold">{formatMoney(order.total)}</p>
                </div>
                <p className="mt-0.5 text-xs capitalize text-slate-500">
                  {order.status} · {order.placedAt}
                </p>
              </div>
            ))}
          </li>
        ) : null}

        {!hasAny ? (
          <li className="px-3 py-8 text-center text-sm text-slate-500">
            No orders yet. Complete a payment or use Order Layaway.
          </li>
        ) : null}
      </ul>
      <PanelFooter href="/orders" label="Open Orders board" />

      <PosDialog
        open={receiptOpen}
        title="Completed order"
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
        <pre className="overflow-auto rounded-md bg-slate-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {receiptText}
        </pre>
      </PosDialog>
    </div>
  );
}

function TablesQuickPanel() {
  const tableId = usePosStore((state) => state.tableId);
  const attachTable = usePosStore((state) => state.attachTable);
  const setActiveTab = usePosStore((state) => state.setActiveTab);
  const tables = INITIAL_TABLES;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-slate-100 p-3">
        <p className="text-sm font-bold text-slate-900">Assign table</p>
        <p className="text-xs text-slate-500">
          {tableId
            ? `Ticket linked to ${tables.find((t) => t.id === tableId)?.label}`
            : "Tap a table for this order"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {(["Main", "Patio", "Bar"] as const).map((zone) => (
          <div key={zone} className="mb-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {zone}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {tables
                .filter((table) => table.zone === zone)
                .map((table) => {
                  const selected = tableId === table.id;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          attachTable(null);
                        } else {
                          attachTable({ id: table.id, label: table.label });
                          setActiveTab("menu");
                        }
                      }}
                      className={`min-h-14 rounded-md border text-xs font-bold transition ${
                        selected
                          ? "border-[var(--pos-accent)] bg-[var(--pos-accent-soft)] text-[var(--pos-accent)]"
                          : table.status === "free"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-amber-200 bg-amber-50 text-amber-950"
                      }`}
                    >
                      {table.label}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <PanelFooter href="/tables" label="Open floor plan" />
    </div>
  );
}

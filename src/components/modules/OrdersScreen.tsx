"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import {
  INITIAL_ORDERS,
  type TicketOrder,
  type TicketStatus,
} from "@/lib/module-data";
import type { CompletedOrder } from "@/lib/types";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { usePosStore } from "@/store/pos-store";

const filters: { id: "all" | TicketStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void" },
];

const statusTone: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-800",
  preparing: "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800",
  paid: "bg-slate-100 text-slate-700",
  void: "bg-rose-100 text-rose-800",
};

function completedToTicket(order: CompletedOrder): TicketOrder {
  return {
    id: order.id,
    number: order.number,
    table: order.tableLabel ?? undefined,
    channel: order.diningOption,
    status: "paid",
    guestName: order.customerName ?? undefined,
    items: order.lines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
    })),
    total: order.total,
    placedAt: order.paidAt,
    server: order.server,
  };
}

export function OrdersScreen() {
  const completedOrders = usePosStore((state) => state.completedOrders);
  const heldOrders = usePosStore((state) => state.heldOrders);
  const [seedOrders, setSeedOrders] = useState(INITIAL_ORDERS);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const liveOrders = useMemo(() => {
    const paid = completedOrders.map(completedToTicket);
    const held: TicketOrder[] = heldOrders.map((order) => ({
      id: order.id,
      number: order.number,
      table: order.tableLabel ?? undefined,
      channel: order.diningOption,
      status: "open",
      guestName: order.customerName ?? undefined,
      items: order.lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
      })),
      total: order.total,
      placedAt: order.heldAt,
      server: "Till",
    }));
    return [...paid, ...held, ...seedOrders];
  }, [completedOrders, heldOrders, seedOrders]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? liveOrders
        : liveOrders.filter((order) => order.status === filter),
    [filter, liveOrders],
  );

  const selected =
    visible.find((order) => order.id === (selectedId ?? visible[0]?.id)) ??
    null;

  const selectedCompleted = completedOrders.find(
    (order) => order.id === selected?.id,
  );

  function updateStatus(orderId: string, status: TicketStatus) {
    if (
      completedOrders.some((order) => order.id === orderId) ||
      heldOrders.some((order) => order.id === orderId)
    ) {
      return;
    }
    setSeedOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  return (
    <ModuleShell
      title="Orders"
      subtitle="Open tickets, kitchen status, and completed sales"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`min-h-10 rounded-md px-3 text-sm font-semibold transition ${
              filter === item.id
                ? "bg-[var(--pos-header)] text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
            {item.id === "paid" && completedOrders.length > 0
              ? ` (${completedOrders.length})`
              : ""}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-2">
          {visible.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                selected?.id === order.id
                  ? "border-[var(--pos-accent)] bg-[var(--pos-accent-soft)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {order.number}
                    {order.table ? (
                      <span className="ml-2 text-slate-500">{order.table}</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {order.channel.replace("_", " ")} · {order.placedAt} ·{" "}
                    {order.server}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(order.total)}</p>
                  <span
                    className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase ${statusTone[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
          {visible.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No orders in this filter.
            </p>
          ) : null}
        </div>

        <OrderDetail
          order={selected}
          receipt={selectedCompleted?.receipt}
          paymentMethod={selectedCompleted?.method}
          onStatusChange={updateStatus}
          locked={Boolean(selectedCompleted)}
        />
      </div>
    </ModuleShell>
  );
}

function OrderDetail({
  order,
  receipt,
  paymentMethod,
  onStatusChange,
  locked,
}: {
  order: TicketOrder | null;
  receipt?: string;
  paymentMethod?: "cash" | "card";
  onStatusChange: (orderId: string, status: TicketStatus) => void;
  locked: boolean;
}) {
  if (!order) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        Select an order to view details.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
            {order.number}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {order.guestName ?? "Walk-in"} · {order.server}
            {paymentMethod ? ` · ${paymentMethod}` : ""}
          </p>
        </div>
        <p className="text-xl font-bold">{formatMoney(order.total)}</p>
      </div>

      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        {order.items.map((item) => (
          <li
            key={`${order.id}-${item.name}`}
            className="flex justify-between text-sm font-medium"
          >
            <span>
              {item.quantity}× {item.name}
            </span>
          </li>
        ))}
      </ul>

      {receipt ? (
        <pre className="mt-4 overflow-auto rounded-md bg-slate-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {receipt}
        </pre>
      ) : null}

      {!locked ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(
              [
                ["open", "Mark open"],
                ["preparing", "Preparing"],
                ["ready", "Ready"],
                ["paid", "Paid"],
              ] as const
            ).map(([status, label]) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(order.id, status)}
                className={`min-h-11 rounded-md text-sm font-semibold transition ${
                  order.status === status
                    ? "bg-[var(--pos-header)] text-white"
                    : "border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onStatusChange(order.id, "void")}
            className="mt-2 min-h-11 w-full rounded-md border border-rose-300 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            Void order
          </button>
        </>
      ) : (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          Completed till payment — receipt above.
        </p>
      )}
    </div>
  );
}

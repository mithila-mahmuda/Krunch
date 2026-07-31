"use client";

import { useState } from "react";
import {
  INITIAL_KITCHEN,
  type KitchenStatus,
  type KitchenTicket,
} from "@/lib/module-data";
import { ModuleShell } from "@/components/modules/ModuleShell";

const columns: { id: KitchenStatus; label: string; tone: string }[] = [
  { id: "queued", label: "Queued", tone: "border-sky-300" },
  { id: "preparing", label: "Preparing", tone: "border-amber-300" },
  { id: "ready", label: "Ready", tone: "border-emerald-300" },
];

const nextStatus: Record<KitchenStatus, KitchenStatus | null> = {
  queued: "preparing",
  preparing: "ready",
  ready: null,
};

export function KitchenScreen() {
  const [tickets, setTickets] = useState(INITIAL_KITCHEN);

  function advance(ticketId: string) {
    setTickets((current) =>
      current
        .map((ticket) => {
          if (ticket.id !== ticketId) return ticket;
          const next = nextStatus[ticket.status];
          if (!next) return null;
          return { ...ticket, status: next };
        })
        .filter((ticket): ticket is KitchenTicket => ticket !== null),
    );
  }

  function bump(ticketId: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, elapsedMinutes: ticket.elapsedMinutes + 1 }
          : ticket,
      ),
    );
  }

  return (
    <ModuleShell
      title="Kitchen Display"
      subtitle="Advance tickets from queue to ready"
      actions={
        <button
          type="button"
          onClick={() =>
            setTickets((current) =>
              current.map((ticket) => ({
                ...ticket,
                elapsedMinutes: ticket.elapsedMinutes + 1,
              })),
            )
          }
          className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50"
        >
          +1 min
        </button>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((column) => {
          const columnTickets = tickets.filter(
            (ticket) => ticket.status === column.id,
          );
          return (
            <section
              key={column.id}
              className={`rounded-lg border-t-4 bg-white p-3 shadow-sm ${column.tone}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                  {column.label}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {columnTickets.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnTickets.map((ticket) => (
                  <KitchenCard
                    key={ticket.id}
                    ticket={ticket}
                    onAdvance={() => advance(ticket.id)}
                    onBump={() => bump(ticket.id)}
                  />
                ))}
                {columnTickets.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400">
                    Clear
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </ModuleShell>
  );
}

function KitchenCard({
  ticket,
  onAdvance,
  onBump,
}: {
  ticket: KitchenTicket;
  onAdvance: () => void;
  onBump: () => void;
}) {
  const urgent = ticket.elapsedMinutes >= 12;

  return (
    <article
      className={`rounded-md border p-3 ${
        urgent
          ? "border-rose-300 bg-rose-50"
          : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">
            {ticket.orderNumber}
            {ticket.table ? (
              <span className="ml-2 text-slate-500">{ticket.table}</span>
            ) : null}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {ticket.channel.replace("_", " ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onBump}
          className={`rounded px-2 py-1 text-xs font-bold ${
            urgent ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          {ticket.elapsedMinutes}m
        </button>
      </div>

      <ul className="mt-3 space-y-1 text-sm font-medium">
        {ticket.items.map((item) => (
          <li key={`${ticket.id}-${item.name}`}>
            {item.quantity}× {item.name}
          </li>
        ))}
      </ul>

      {ticket.notes ? (
        <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
          {ticket.notes}
        </p>
      ) : null}

      {ticket.status === "ready" ? (
        <button
          type="button"
          onClick={onAdvance}
          className="mt-3 min-h-10 w-full rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Bump / served
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdvance}
          className="mt-3 min-h-10 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white hover:brightness-110"
        >
          {ticket.status === "queued" ? "Start prep" : "Mark ready"}
        </button>
      )}
    </article>
  );
}

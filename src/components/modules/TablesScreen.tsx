"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import {
  INITIAL_TABLES,
  type FloorTable,
  type TableStatus,
} from "@/lib/module-data";
import { ModuleShell } from "@/components/modules/ModuleShell";

const statusTone: Record<TableStatus, string> = {
  free: "bg-emerald-50 border-emerald-200 text-emerald-900",
  seated: "bg-sky-50 border-sky-200 text-sky-900",
  ordered: "bg-amber-50 border-amber-200 text-amber-950",
  bill: "bg-violet-50 border-violet-200 text-violet-950",
};

const nextStatus: Record<TableStatus, TableStatus> = {
  free: "seated",
  seated: "ordered",
  ordered: "bill",
  bill: "free",
};

export function TablesScreen() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [selectedId, setSelectedId] = useState<string | null>("t4");
  const [zone, setZone] = useState<"All" | FloorTable["zone"]>("All");

  const visible = useMemo(
    () =>
      zone === "All" ? tables : tables.filter((table) => table.zone === zone),
    [tables, zone],
  );

  const selected = tables.find((table) => table.id === selectedId) ?? null;

  function cycleStatus(tableId: string) {
    setTables((current) =>
      current.map((table) => {
        if (table.id !== tableId) return table;
        const status = nextStatus[table.status];
        if (status === "free") {
          return {
            ...table,
            status,
            guestCount: undefined,
            openTotal: undefined,
            server: undefined,
          };
        }
        if (status === "seated") {
          return {
            ...table,
            status,
            guestCount: table.guestCount ?? Math.min(2, table.seats),
            server: table.server ?? "Maya",
            openTotal: undefined,
          };
        }
        if (status === "ordered") {
          return {
            ...table,
            status,
            openTotal: table.openTotal ?? 12.5,
          };
        }
        return { ...table, status };
      }),
    );
  }

  return (
    <ModuleShell
      title="Tabs & Tables"
      subtitle="Floor overview — tap a table to manage its tab"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(["All", "Main", "Patio", "Bar"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setZone(item)}
            className={`min-h-10 rounded-md px-3 text-sm font-semibold ${
              zone === item
                ? "bg-[var(--pos-header)] text-white"
                : "border border-slate-300 bg-white hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => setSelectedId(table.id)}
              className={`min-h-[96px] rounded-lg border-2 px-3 py-3 text-left transition ${
                statusTone[table.status]
              } ${
                selected?.id === table.id
                  ? "ring-2 ring-[var(--pos-accent)] ring-offset-2"
                  : ""
              }`}
            >
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">
                {table.label}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {table.status} · {table.seats} seats
              </p>
              {table.openTotal != null ? (
                <p className="mt-2 text-sm font-bold">
                  {formatMoney(table.openTotal)}
                </p>
              ) : null}
            </button>
          ))}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          {selected ? (
            <>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {selected.label}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selected.zone} · {selected.seats} seats
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold capitalize">{selected.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Guests</dt>
                  <dd className="font-semibold">
                    {selected.guestCount ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Server</dt>
                  <dd className="font-semibold">{selected.server ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Open tab</dt>
                  <dd className="font-semibold">
                    {selected.openTotal != null
                      ? formatMoney(selected.openTotal)
                      : "—"}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => cycleStatus(selected.id)}
                className="mt-5 min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white hover:brightness-110"
              >
                Advance to {nextStatus[selected.status]}
              </button>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              Select a table.
            </p>
          )}
        </aside>
      </div>
    </ModuleShell>
  );
}

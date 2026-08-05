"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignedBranchBadge } from "@/components/AssignedBranchBadge";
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { formatMoney } from "@/lib/format";
import type { FloorTable, TableStatus } from "@/lib/module-data";
import { useOpsStore } from "@/store/ops-store";
import { usePosStore } from "@/store/pos-store";

const statusTone: Record<TableStatus, string> = {
  free: "bg-emerald-50 border-emerald-200 text-emerald-900",
  seated: "bg-sky-50 border-sky-200 text-sky-900",
  ordered: "bg-amber-50 border-amber-200 text-amber-950",
  bill: "bg-violet-50 border-violet-200 text-violet-950",
};

export function TablesScreen() {
  const router = useRouter();
  const tables = useOpsStore((state) => state.tables);
  const seatTable = useOpsStore((state) => state.seatTable);
  const setTableBill = useOpsStore((state) => state.setTableBill);
  const freeTable = useOpsStore((state) => state.freeTable);
  const loadTableTab = usePosStore((state) => state.loadTableTab);
  const setStatusMessage = usePosStore((state) => state.setStatusMessage);
  const {
    options: branchOptions,
    selectedBranchIds,
    setSelectedBranchIds,
    branchIds,
    allLabel: branchAllLabel,
    showBranchFilter,
    branchBadgeName,
  } = useBranchFilter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zone, setZone] = useState<"All" | FloorTable["zone"]>("All");
  const [message, setMessage] = useState("");

  const scopedTables = useMemo(
    () => tables.filter((table) => branchIds.includes(table.branchId)),
    [tables, branchIds],
  );

  const visible = useMemo(
    () =>
      zone === "All"
        ? scopedTables
        : scopedTables.filter((table) => table.zone === zone),
    [scopedTables, zone],
  );

  const resolvedSelectedId =
    selectedId && visible.some((table) => table.id === selectedId)
      ? selectedId
      : (visible[0]?.id ?? null);

  const selected =
    tables.find((table) => table.id === resolvedSelectedId) ?? null;

  function advanceTable(table: FloorTable) {
    if (table.status === "free") {
      seatTable(table.id);
      return;
    }
    if (table.status === "seated") {
      setMessage("Assign items on the till, then Send to kitchen or Hold.");
      return;
    }
    if (table.status === "ordered") {
      setTableBill(table.id);
      return;
    }
    freeTable(table.id);
  }

  function openOnTill(table: FloorTable) {
    const result = loadTableTab(table.id);
    if (!result.ok) {
      setMessage(result.error);
      setStatusMessage(result.error);
      return;
    }
    router.push("/pos");
  }

  return (
    <ModuleShell
      title="Tabs & Tables"
      titleAddon={
        branchBadgeName ? (
          <AssignedBranchBadge name={branchBadgeName} />
        ) : null
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["All", "Main", "Patio", "Bar"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setZone(item)}
              className={`min-h-10 rounded-md px-3 text-sm font-semibold ${
                zone === item
                  ? "bg-[var(--pos-header)] text-pos-on-header"
                  : "border border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        {showBranchFilter ? (
          <div className="w-full max-w-xs sm:w-56">
            <SearchableMultiSelect
              compact
              label="Branch"
              options={branchOptions}
              values={selectedBranchIds}
              onChange={setSelectedBranchIds}
              allLabel={branchAllLabel}
              searchPlaceholder="Search branches…"
            />
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => {
                setSelectedId(table.id);
                setMessage("");
              }}
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
                onClick={() => openOnTill(selected)}
                className="mt-5 min-h-11 w-full rounded-md bg-[var(--action-pay)] text-sm font-semibold text-white hover:brightness-110"
              >
                Open on till
              </button>
              <button
                type="button"
                onClick={() => advanceTable(selected)}
                className="mt-2 min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-pos-on-header hover:brightness-110"
              >
                {selected.status === "free"
                  ? "Seat guests"
                  : selected.status === "seated"
                    ? "Need order on till"
                    : selected.status === "ordered"
                      ? "Move to bill"
                      : "Clear table"}
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

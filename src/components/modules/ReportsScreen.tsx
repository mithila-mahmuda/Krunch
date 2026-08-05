"use client";

import { useMemo, useState } from "react";
import { AssignedBranchBadge } from "@/components/AssignedBranchBadge";
import { DateRangeSelect } from "@/components/DateRangeSelect";
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { matchesBranchScope } from "@/lib/branch-access";
import {
  dateRangeBounds,
  defaultDateRange,
  type DateRangeValue,
} from "@/lib/date-range";
import {
  cashEventLabel,
  diningOptionLabel,
  formatMoney,
  formatTillClock,
  paymentMethodLabel,
} from "@/lib/format";
import { can } from "@/lib/permissions";
import {
  buildSalesReport,
  channelLabel,
  listReportServers,
  type PaymentMethod,
} from "@/lib/reports";
import type { DiningOption } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useOpsStore } from "@/store/ops-store";
import { useSettingsStore } from "@/store/settings-store";
import { useStaffStore } from "@/store/staff-store";

const CHANNEL_OPTIONS: { value: DiningOption; label: string }[] = [
  { value: "eat_in", label: diningOptionLabel("eat_in") },
  { value: "takeaway", label: diningOptionLabel("takeaway") },
  { value: "delivery", label: diningOptionLabel("delivery") },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: paymentMethodLabel("cash") },
  { value: "card", label: paymentMethodLabel("card") },
];

export function ReportsScreen() {
  const user = useAuthStore((state) => state.user);
  const orders = useOpsStore((state) => state.orders);
  const cashEvents = useOpsStore((state) => state.cashEvents);
  const floatAmount = useOpsStore((state) => state.floatAmount);
  const showDemoSeed = useSettingsStore((state) => state.showDemoSeed);
  const canViewCashLog =
    can(user?.role, "open_drawer") || can(user?.role, "adjust_float");

  const {
    options: branchOptions,
    selectedBranchIds,
    setSelectedBranchIds,
    branchIds,
    allLabel: branchAllLabel,
    showBranchFilter,
    branchBadgeName,
  } = useBranchFilter();

  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultDateRange);
  const [channels, setChannels] = useState<DiningOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [servers, setServers] = useState<string[]>([]);

  const sourceOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!showDemoSeed && order.source !== "till") return false;
      return matchesBranchScope(order, branchIds);
    });
  }, [orders, showDemoSeed, branchIds]);

  const staff = useStaffStore((state) => state.staff);

  const serverOptions = useMemo(() => {
    const staffNames = staff
      .filter((row) => !row.archived)
      .map((row) => row.name);
    const fromOrders = listReportServers(sourceOrders);
    return [...new Set([...staffNames, ...fromOrders])]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [sourceOrders, staff]);

  const filters = useMemo(
    () => ({ dateRange, channels, paymentMethods, servers }),
    [dateRange, channels, paymentMethods, servers],
  );

  const report = useMemo(
    () => buildSalesReport(sourceOrders, filters),
    [sourceOrders, filters],
  );

  const cashEventsInRange = useMemo(() => {
    if (!canViewCashLog) return [];
    const { start, end } = dateRangeBounds(dateRange);
    return cashEvents.filter((event) => {
      const at = new Date(event.createdAt);
      if (at < start || at > end) return false;
      return matchesBranchScope(event, branchIds);
    });
  }, [canViewCashLog, cashEvents, dateRange, branchIds]);

  const maxHourly = Math.max(1, ...report.hourly.map((row) => row.sales));

  function resetFilters() {
    setDateRange(defaultDateRange());
    setSelectedBranchIds([]);
    setChannels([]);
    setPaymentMethods([]);
    setServers([]);
  }

  return (
    <ModuleShell
      title="Reports"
      titleAddon={
        branchBadgeName ? (
          <AssignedBranchBadge name={branchBadgeName} />
        ) : null
      }
    >
      <section className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div
            className={`grid min-w-0 flex-1 gap-2 sm:grid-cols-2 ${
              showBranchFilter ? "lg:grid-cols-5" : "lg:grid-cols-4"
            }`}
          >
            <DateRangeSelect
              compact
              value={dateRange}
              onChange={setDateRange}
            />
            {showBranchFilter ? (
              <SearchableMultiSelect
                compact
                label="Branch"
                options={branchOptions}
                values={selectedBranchIds}
                onChange={setSelectedBranchIds}
                allLabel={branchAllLabel}
                searchPlaceholder="Search branches…"
              />
            ) : null}
            <SearchableMultiSelect
              compact
              label="Channel"
              options={CHANNEL_OPTIONS}
              values={channels}
              onChange={(next) => setChannels(next as DiningOption[])}
              allLabel="All channels"
              searchPlaceholder="Search channels…"
            />
            <SearchableMultiSelect
              compact
              label="Payment method"
              options={PAYMENT_METHOD_OPTIONS}
              values={paymentMethods}
              onChange={(next) => setPaymentMethods(next as PaymentMethod[])}
              allLabel="All payment methods"
              searchPlaceholder="Search payment methods…"
            />
            <SearchableMultiSelect
              compact
              label="Server"
              options={serverOptions}
              values={servers}
              onChange={setServers}
              allLabel="All servers"
              searchPlaceholder="Search servers…"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-10 shrink-0 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Net sales", value: formatMoney(report.netSales) },
          { label: "Orders", value: String(report.orders) },
          { label: "Avg ticket", value: formatMoney(report.averageTicket) },
          { label: "Covers", value: String(report.covers) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Hourly sales
          </h2>
          <div className="mt-4 flex h-44 items-end gap-1.5 sm:gap-2">
            {report.hourly.map((row) => (
              <div
                key={row.hour}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t bg-[var(--pos-menu)]"
                  style={{
                    height: `${Math.max(
                      row.sales > 0 ? 8 : 2,
                      (row.sales / maxHourly) * 100,
                    )}%`,
                  }}
                  title={`${row.hour}:00 — ${formatMoney(row.sales)}`}
                />
                <span className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                  {row.hour}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Top sellers
          </h2>
          {report.topItems.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No item sales yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {report.topItems.map((item, index) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-slate-500">{item.qty} sold</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatMoney(item.revenue)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
            By channel
          </h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {report.byChannel.map((row) => (
              <li
                key={row.channel}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold">{channelLabel(row.channel)}</p>
                  <p className="text-slate-500">
                    {row.orders} order{row.orders === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="font-bold">{formatMoney(row.sales)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
            By payment method
          </h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {report.byPaymentMethod.map((row) => (
              <li
                key={row.method}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold capitalize">{row.method}</p>
                  <p className="text-slate-500">
                    {row.orders} order{row.orders === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="font-bold">{formatMoney(row.sales)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Gross sales
          </p>
          <p className="mt-1 text-xl font-bold">
            {formatMoney(report.grossSales)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Discounts
          </p>
          <p className="mt-1 text-xl font-bold">
            {formatMoney(report.discounts)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Voids
          </p>
          <p className="mt-1 text-xl font-bold">{report.voids}</p>
        </div>
      </div>

      {canViewCashLog ? (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                Cash drawer · {branchAllLabel}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                No-sale, petty cash, float changes, and cash sales for this
                branch in the selected date range.
              </p>
            </div>
            <p className="text-sm font-bold text-slate-800">
              Float {formatMoney(floatAmount)}
            </p>
          </div>

          {cashEventsInRange.length === 0 ? (
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-500">
              No cash events in this range. Use No Sale, Petty Cash, Adjust
              Float, or take a cash payment on the till.
            </p>
          ) : (
            <ul className="mt-4 max-h-80 divide-y divide-slate-100 overflow-auto rounded-md border border-slate-200">
              {cashEventsInRange.slice(0, 50).map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {cashEventLabel(event.type)}
                      {event.amount > 0 ? (
                        <span className="ml-2 font-bold text-slate-800">
                          {formatMoney(event.amount)}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-slate-500">{event.reason}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {event.staffName}
                      {event.tillName ? ` · ${event.tillName}` : ""}
                      {event.orderNumber ? ` · ${event.orderNumber}` : ""}
                      {" · "}
                      float after {formatMoney(event.floatAfter)}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs font-medium text-slate-500"
                    dateTime={event.createdAt}
                  >
                    {formatTillClock(new Date(event.createdAt))}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </ModuleShell>
  );
}

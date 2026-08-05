"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Printer, Receipt } from "lucide-react";
import { AssignedBranchBadge } from "@/components/AssignedBranchBadge";
import { DateRangeSelect } from "@/components/DateRangeSelect";
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { orderLineGrid } from "@/components/pos/ItemControls";
import { ReceiptTicket } from "@/components/receipt/ReceiptTicket";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { matchesBranchScope } from "@/lib/branch-access";
import { defaultDateRange, type DateRangeValue } from "@/lib/date-range";
import {
  diningOptionLabel,
  formatClockTime,
  formatMoney,
  paymentMethodLabel,
} from "@/lib/format";
import type { TicketOrder, TicketStatus } from "@/lib/module-data";
import { printReceiptText } from "@/lib/print-receipt";
import {
  filterReportOrders,
  listReportServers,
  type PaymentMethod,
} from "@/lib/reports";
import type { DiningOption } from "@/lib/types";
import { useOpsStore } from "@/store/ops-store";
import { usePosStore } from "@/store/pos-store";
import { useSettingsStore } from "@/store/settings-store";
import { useStaffStore } from "@/store/staff-store";

type StatusFilter = "all" | TicketStatus | "served";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "served", label: "Served" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void" },
];

const CHANNEL_OPTIONS: { value: DiningOption; label: string }[] = [
  { value: "eat_in", label: diningOptionLabel("eat_in") },
  { value: "takeaway", label: diningOptionLabel("takeaway") },
  { value: "delivery", label: diningOptionLabel("delivery") },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: paymentMethodLabel("cash") },
  { value: "card", label: paymentMethodLabel("card") },
];

type FoodStage = "open" | "preparing" | "ready" | "served";
type PaymentStage = "paid" | "unpaid" | "void";

const foodTone: Record<FoodStage, string> = {
  open: "bg-sky-100 text-sky-800",
  preparing: "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800",
  served: "bg-indigo-100 text-indigo-800",
};

const paymentTone: Record<PaymentStage, string> = {
  unpaid: "bg-orange-100 text-orange-800",
  paid: "bg-slate-100 text-slate-700",
  void: "bg-rose-100 text-rose-800",
};

/** Kitchen/board food progress — not payment. */
function foodStageFor(order: TicketOrder): FoodStage {
  if (order.kitchenStatus === "served") return "served";
  if (order.kitchenStatus === "preparing") return "preparing";
  if (order.kitchenStatus === "ready") return "ready";
  if (order.kitchenStatus === "queued") return "open";
  // Legacy bump cleared kitchenStatus and left board status as ready.
  if (order.kitchenStatus == null && order.status === "ready") return "served";
  if (order.status === "preparing") return "preparing";
  if (order.status === "paid") return "served";
  return "open";
}

function matchesStatusFilter(
  order: TicketOrder,
  filter: StatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "served") {
    return foodStageFor(order) === "served";
  }
  if (filter === "ready") {
    return order.kitchenStatus === "ready";
  }
  if (filter === "open") {
    return (
      order.status === "open" &&
      order.kitchenStatus !== "served" &&
      foodStageFor(order) === "open"
    );
  }
  if (filter === "preparing") {
    return (
      order.kitchenStatus === "preparing" ||
      (order.status === "preparing" && order.kitchenStatus == null)
    );
  }
  return order.status === filter;
}

function paymentStageFor(order: TicketOrder): PaymentStage {
  if (order.status === "paid") return "paid";
  if (order.status === "void") return "void";
  return "unpaid";
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase ${tone}`}
    >
      {label}
    </span>
  );
}

function FoodStatusPill({ order }: { order: TicketOrder }) {
  const food = foodStageFor(order);
  return <StatusPill label={food} tone={foodTone[food]} />;
}

function PaymentStatusPill({ order }: { order: TicketOrder }) {
  const payment = paymentStageFor(order);
  return <StatusPill label={payment} tone={paymentTone[payment]} />;
}

export function OrdersScreen() {
  const orders = useOpsStore((state) => state.orders);
  const showDemoSeed = useSettingsStore((state) => state.showDemoSeed);
  const restaurantName = useSettingsStore((state) => state.restaurantName);
  const restaurantPhone = useSettingsStore((state) => state.restaurantPhone);
  const restaurantAddress = useSettingsStore(
    (state) => state.restaurantAddress,
  );
  const restaurantLogoDataUrl = useSettingsStore(
    (state) => state.restaurantLogoDataUrl,
  );

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    useOpsStore.getState().upgradeLegacyReceipts();
  }, []);

  const liveOrders = useMemo(() => {
    void orders;
    void showDemoSeed;
    void restaurantName;
    void restaurantPhone;
    void restaurantAddress;
    void restaurantLogoDataUrl;
    return useOpsStore
      .getState()
      .getTicketOrders()
      .filter((order) => matchesBranchScope(order, branchIds));
  }, [
    orders,
    showDemoSeed,
    restaurantName,
    restaurantPhone,
    restaurantAddress,
    restaurantLogoDataUrl,
    branchIds,
  ]);

  const staff = useStaffStore((state) => state.staff);

  const serverOptions = useMemo(() => {
    const staffNames = staff
      .filter((row) => !row.archived)
      .map((row) => row.name);
    const fromOrders = listReportServers(liveOrders);
    return [...new Set([...staffNames, ...fromOrders])]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [liveOrders, staff]);

  const reportFilters = useMemo(
    () => ({ dateRange, channels, paymentMethods, servers }),
    [dateRange, channels, paymentMethods, servers],
  );

  const scopedOrders = useMemo(
    () => filterReportOrders(liveOrders, reportFilters),
    [liveOrders, reportFilters],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: scopedOrders.length,
      open: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      paid: 0,
      void: 0,
    };
    for (const order of scopedOrders) {
      for (const filter of STATUS_FILTERS) {
        if (filter.id === "all") continue;
        if (matchesStatusFilter(order, filter.id)) {
          counts[filter.id] += 1;
        }
      }
    }
    return counts;
  }, [scopedOrders]);

  const visible = useMemo(
    () =>
      scopedOrders.filter((order) =>
        matchesStatusFilter(order, statusFilter),
      ),
    [statusFilter, scopedOrders],
  );

  const selected =
    visible.find((order) => order.id === (selectedId ?? visible[0]?.id)) ??
    null;

  function resetFilters() {
    setDateRange(defaultDateRange());
    setSelectedBranchIds([]);
    setChannels([]);
    setPaymentMethods([]);
    setServers([]);
    setStatusFilter("all");
  }

  return (
    <ModuleShell
      title="Orders"
      titleAddon={
        branchBadgeName ? (
          <AssignedBranchBadge name={branchBadgeName} />
        ) : null
      }
    >
      <section className="mb-4 rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2 lg:flex-row lg:items-center">
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

        <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-1 rounded-md bg-slate-100 p-1"
            role="tablist"
            aria-label="Order status"
          >
            {STATUS_FILTERS.map((item) => {
              const count = statusCounts[item.id];
              const active = statusFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(item.id)}
                  className={`min-h-9 rounded px-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                  <span
                    className={`ml-1.5 tabular-nums ${
                      active ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="shrink-0 text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700 tabular-nums">
              {visible.length}
            </span>{" "}
            {visible.length === 1 ? "order" : "orders"}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {visible.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">
              No orders match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Order
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      Time
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      Channel
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      Server
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-semibold"
                    >
                      Items
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-right font-semibold"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => {
                    const isSelected = selected?.id === order.id;
                    const itemQty = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    return (
                      <tr
                        key={order.id}
                        tabIndex={0}
                        aria-selected={isSelected}
                        onClick={() => setSelectedId(order.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedId(order.id);
                          }
                        }}
                        className={`cursor-pointer border-b border-slate-100 last:border-b-0 transition ${
                          isSelected
                            ? "bg-[var(--pos-accent-soft)]"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">
                              {order.number}
                            </p>
                            {order.table ? (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                                {order.table}
                              </span>
                            ) : null}
                            {order.held ? (
                              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-bold uppercase text-violet-700">
                                Held
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle text-sm tabular-nums text-slate-600">
                          {formatClockTime(order.placedAt)}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm text-slate-600">
                          {diningOptionLabel(order.channel)}
                        </td>
                        <td className="max-w-[8rem] truncate px-3 py-3 align-middle text-sm text-slate-600">
                          {order.server}
                        </td>
                        <td className="px-3 py-3 text-right align-middle text-sm tabular-nums text-slate-600">
                          {itemQty}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <FoodStatusPill order={order} />
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <PaymentStatusPill order={order} />
                        </td>
                        <td className="px-4 py-3 text-right align-middle">
                          <p className="font-semibold tabular-nums text-slate-900">
                            {formatMoney(order.total)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <OrderDetail order={selected} />
      </div>
    </ModuleShell>
  );
}

function OrderDetail({ order }: { order: TicketOrder | null }) {
  const router = useRouter();
  const loadOpenOrder = usePosStore((state) => state.loadOpenOrder);
  const setOrderPanelOpen = usePosStore((state) => state.setOrderPanelOpen);

  const canEdit =
    order != null && order.status !== "paid" && order.status !== "void";

  function editOnTill() {
    if (!order) return;
    const result = loadOpenOrder(order.id);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    setOrderPanelOpen(true);
    router.push("/pos");
  }

  if (!order) {
    return (
      <aside className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
        <Receipt className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
        <p className="mt-3 text-sm text-slate-500">
          Select an order to view details.
        </p>
      </aside>
    );
  }

  return (
    <aside className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            {order.number}
          </p>
          <p className="text-right font-[family-name:var(--font-display)] text-xl font-bold tabular-nums">
            {formatMoney(order.total)}
          </p>
          <p className="min-w-0 truncate self-center text-sm text-slate-600">
            {order.guestName ?? "Walk-in"}
            {order.table ? ` · ${order.table}` : ""}
          </p>
          <div className="flex flex-wrap justify-end gap-1 self-center">
            <FoodStatusPill order={order} />
            <PaymentStatusPill order={order} />
            {order.held ? (
              <StatusPill label="held" tone="bg-violet-100 text-violet-700" />
            ) : null}
          </div>
        </div>

        {canEdit || order.receipt ? (
          <div
            className={`mt-3 grid gap-2 ${
              canEdit && order.receipt ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {canEdit ? (
              <button
                type="button"
                onClick={editOnTill}
                className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : null}
            {order.receipt ? (
              <button
                type="button"
                onClick={() => {
                  const printed = printReceiptText(order.receipt!);
                  if (!printed) {
                    window.alert(
                      "Pop-up blocked — allow pop-ups for this site to print.",
                    );
                  }
                }}
                className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md bg-[var(--pos-header)] text-sm font-semibold text-pos-on-header hover:brightness-110"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-b border-slate-100">
        <div
          className={`${orderLineGrid} border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500`}
        >
          <span>Item</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">Total</span>
        </div>
        <ul>
          {order.items.map((item, index) => {
            const unitPrice = item.unitPrice ?? 0;
            const gross = unitPrice * item.quantity;
            const discountAmount = item.discountAmount ?? 0;
            const discountLabel =
              item.promotionLabel ||
              (discountAmount > 0 ? "Discount" : null);

            return (
              <li
                key={`${order.id}-${item.name}-${index}`}
                className="border-b border-slate-100 bg-white text-slate-900 last:border-b-0"
              >
                <div
                  className={`${orderLineGrid} px-3 py-2 text-sm leading-snug`}
                >
                  <div className="min-w-0">
                    <p className="break-words font-bold text-slate-900">
                      {item.name}
                    </p>
                    {item.note ? (
                      <p className="break-words text-xs italic text-slate-500">
                        Note: {item.note}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-center font-medium text-slate-800">
                    {item.quantity}
                  </span>
                  <span className="text-right text-slate-700">
                    {formatMoney(unitPrice)}
                  </span>
                  <span className="text-right font-semibold text-slate-900">
                    {formatMoney(gross)}
                  </span>
                </div>
                {discountLabel ? (
                  <div className="flex items-start justify-between gap-2 px-3 pb-1.5 text-xs text-slate-500">
                    <p className="min-w-0 flex-1 truncate">{discountLabel}</p>
                    {discountAmount > 0 ? (
                      <p className="shrink-0 font-medium">
                        −{formatMoney(discountAmount)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {order.receipt ? (
        <div className="px-4 py-3">
          <div className="rounded-md bg-slate-50 px-3 py-4">
            <ReceiptTicket receipt={order.receipt} />
          </div>
        </div>
      ) : (
        <p className="px-4 py-3 text-center text-xs text-slate-500">
          Pay on the till to generate a receipt.
        </p>
      )}
    </aside>
  );
}

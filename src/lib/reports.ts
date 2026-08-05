import { isWithinInterval } from "date-fns";
import {
  dateRangeBounds,
  defaultDateRange,
  formatDateRangeLabel,
  type DateRangeValue,
} from "@/lib/date-range";
import { diningOptionLabel, paymentMethodLabel } from "@/lib/format";
import type { DiningOption, OpsOrder } from "@/lib/types";

export type PaymentMethod = "cash" | "card";

export interface ReportFilters {
  dateRange: DateRangeValue;
  /** Empty = all channels. */
  channels: DiningOption[];
  /** Empty = all payment methods. */
  paymentMethods: PaymentMethod[];
  /** Empty = all servers. */
  servers: string[];
}

export interface SalesReport {
  dateLabel: string;
  netSales: number;
  grossSales: number;
  orders: number;
  averageTicket: number;
  covers: number;
  voids: number;
  discounts: number;
  topItems: { name: string; qty: number; revenue: number }[];
  hourly: { hour: string; sales: number }[];
  byChannel: { channel: DiningOption; sales: number; orders: number }[];
  byPaymentMethod: {
    method: "cash" | "card" | "unknown";
    sales: number;
    orders: number;
  }[];
}

const BUSINESS_HOURS = [
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
];

const EMPTY_FILTERS: ReportFilters = {
  dateRange: defaultDateRange(),
  channels: [],
  paymentMethods: [],
  servers: [],
};

export function channelLabel(channel: DiningOption): string {
  return diningOptionLabel(channel);
}

/** Minimal order shape for date / channel / payment / server filters. */
export type FilterableOrder = {
  placedAt: string;
  paidAt?: string;
  diningOption?: DiningOption;
  /** TicketOrder uses channel instead of diningOption. */
  channel?: DiningOption;
  method?: PaymentMethod;
  server: string;
  status: string;
};

export function listReportServers(orders: { server: string }[]): string[] {
  return [...new Set(orders.map((order) => order.server).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

/** Resolve order time for reporting — ISO preferred; HH:MM treated as today. */
export function orderEventAt(order: {
  paidAt?: string;
  placedAt: string;
}): Date {
  const raw = order.paidAt ?? order.placedAt;
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  const match = /^(\d{1,2}):(\d{2})/.exec(raw);
  const date = new Date();
  if (match) {
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }
  return date;
}

function orderChannel(order: FilterableOrder): DiningOption | undefined {
  return order.diningOption ?? order.channel;
}

export function filterReportOrders<T extends FilterableOrder>(
  orders: T[],
  filters: ReportFilters,
): T[] {
  const channels = new Set(filters.channels);
  const paymentMethods = new Set(filters.paymentMethods);
  const servers = new Set(filters.servers);
  const { start, end } = dateRangeBounds(filters.dateRange);

  return orders.filter((order) => {
    const at = orderEventAt(order);
    if (!isWithinInterval(at, { start, end })) {
      return false;
    }
    const channel = orderChannel(order);
    if (channels.size > 0 && (!channel || !channels.has(channel))) {
      return false;
    }
    if (paymentMethods.size > 0) {
      if (
        order.status !== "paid" ||
        !order.method ||
        !paymentMethods.has(order.method)
      ) {
        return false;
      }
    }
    if (servers.size > 0 && !servers.has(order.server)) {
      return false;
    }
    return true;
  });
}

function hourBucket(value: string | Date): string {
  if (value instanceof Date) {
    return String(value.getHours()).padStart(2, "0");
  }
  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) {
    return String(new Date(iso).getHours()).padStart(2, "0");
  }
  const match = /^(\d{1,2}):/.exec(value);
  if (!match) return "—";
  return match[1]!.padStart(2, "0");
}

function filtersLabel(filters: ReportFilters): string {
  const parts = [formatDateRangeLabel(filters.dateRange)];
  if (filters.channels.length === 1) {
    parts.push(diningOptionLabel(filters.channels[0]!));
  } else if (filters.channels.length > 1) {
    parts.push(`${filters.channels.length} channels`);
  }
  if (filters.paymentMethods.length === 1) {
    parts.push(paymentMethodLabel(filters.paymentMethods[0]!));
  } else if (filters.paymentMethods.length > 1) {
    parts.push(`${filters.paymentMethods.length} payment methods`);
  }
  if (filters.servers.length === 1) {
    parts.push(filters.servers[0]!);
  } else if (filters.servers.length > 1) {
    parts.push(`${filters.servers.length} servers`);
  }
  return parts.join(" · ");
}

export function buildSalesReport(
  orders: OpsOrder[],
  filters: ReportFilters = EMPTY_FILTERS,
): SalesReport {
  const scoped = filterReportOrders(orders, filters);
  const paid = scoped.filter((order) => order.status === "paid");
  const voids = scoped.filter((order) => order.status === "void").length;

  const netSales = paid.reduce((sum, order) => sum + order.total, 0);
  const discounts = paid.reduce(
    (sum, order) =>
      sum +
      order.lines.reduce((lineSum, line) => lineSum + line.discountAmount, 0),
    0,
  );
  const grossSales = netSales + discounts;

  const itemMap = new Map<string, { qty: number; revenue: number }>();
  for (const order of paid) {
    for (const line of order.lines) {
      const existing = itemMap.get(line.name) ?? { qty: 0, revenue: 0 };
      existing.qty += line.quantity;
      existing.revenue += line.unitPrice * line.quantity - line.discountAmount;
      itemMap.set(line.name, existing);
    }
  }

  const topItems = [...itemMap.entries()]
    .map(([name, stats]) => ({
      name,
      qty: stats.qty,
      revenue: Math.round(stats.revenue * 100) / 100,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  const hourlyMap = new Map<string, number>();
  for (const hour of BUSINESS_HOURS) hourlyMap.set(hour, 0);
  for (const order of paid) {
    const hour = hourBucket(orderEventAt(order));
    if (!hourlyMap.has(hour)) hourlyMap.set(hour, 0);
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + order.total);
  }

  const hourly = [...hourlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, sales]) => ({
      hour,
      sales: Math.round(sales * 100) / 100,
    }));

  const channelMap = new Map<DiningOption, { sales: number; orders: number }>();
  for (const channel of ["eat_in", "takeaway", "delivery"] as DiningOption[]) {
    channelMap.set(channel, { sales: 0, orders: 0 });
  }
  for (const order of paid) {
    const bucket = channelMap.get(order.diningOption) ?? {
      sales: 0,
      orders: 0,
    };
    bucket.sales += order.total;
    bucket.orders += 1;
    channelMap.set(order.diningOption, bucket);
  }

  const paymentMethodMap = new Map<
    "cash" | "card" | "unknown",
    { sales: number; orders: number }
  >([
    ["cash", { sales: 0, orders: 0 }],
    ["card", { sales: 0, orders: 0 }],
    ["unknown", { sales: 0, orders: 0 }],
  ]);
  for (const order of paid) {
    const key = order.method ?? "unknown";
    const bucket = paymentMethodMap.get(key)!;
    bucket.sales += order.total;
    bucket.orders += 1;
  }

  const covers = paid.reduce((sum, order) => {
    if (order.diningOption === "eat_in") {
      return sum + Math.max(1, Math.ceil(order.lines.length / 2));
    }
    return sum;
  }, 0);

  return {
    dateLabel: filtersLabel(filters),
    netSales: Math.round(netSales * 100) / 100,
    grossSales: Math.round(grossSales * 100) / 100,
    orders: paid.length,
    averageTicket:
      paid.length > 0 ? Math.round((netSales / paid.length) * 100) / 100 : 0,
    covers,
    voids,
    discounts: Math.round(discounts * 100) / 100,
    topItems,
    hourly,
    byChannel: [...channelMap.entries()].map(([channel, stats]) => ({
      channel,
      sales: Math.round(stats.sales * 100) / 100,
      orders: stats.orders,
    })),
    byPaymentMethod: [...paymentMethodMap.entries()]
      .filter(([method, stats]) => method !== "unknown" || stats.orders > 0)
      .map(([method, stats]) => ({
        method,
        sales: Math.round(stats.sales * 100) / 100,
        orders: stats.orders,
      })),
  };
}

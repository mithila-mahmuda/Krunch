import { SERVICE_RATE, TAX_RATE } from "@/lib/mock-data";
import type { OrderLine, OrderTotals } from "@/lib/types";
import { useSettingsStore } from "@/store/settings-store";

export function getTaxRate(): number {
  if (typeof window === "undefined") return TAX_RATE;
  return useSettingsStore.getState().taxRate;
}

export function getServiceRate(): number {
  if (typeof window === "undefined") return SERVICE_RATE;
  return useSettingsStore.getState().serviceRate;
}

export function getTaxInclusive(): boolean {
  if (typeof window === "undefined") return true;
  return useSettingsStore.getState().taxInclusive;
}

export function computeTotals(
  lines: OrderLine[],
  serviceEnabled: boolean,
  rates?: {
    taxRate?: number;
    serviceRate?: number;
    taxInclusive?: boolean;
  },
): OrderTotals {
  const taxRate = rates?.taxRate ?? getTaxRate();
  const serviceRate = rates?.serviceRate ?? getServiceRate();
  const taxInclusive = rates?.taxInclusive ?? getTaxInclusive();

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const totalDiscount = lines.reduce(
    (sum, line) => sum + line.discountAmount,
    0,
  );
  const afterDiscount = Math.max(0, subtotal - totalDiscount);
  const serviceCharge = serviceEnabled ? afterDiscount * serviceRate : 0;
  const net = afterDiscount + serviceCharge;

  let tax: number;
  let total: number;
  if (taxInclusive) {
    // Menu prices already include VAT — extract the embedded portion.
    tax = net - net / (1 + taxRate);
    total = net;
  } else {
    // Menu prices are ex-VAT — add tax on top.
    tax = net * taxRate;
    total = net + tax;
  }

  const due = total;

  return {
    itemCount,
    subtotal,
    totalDiscount,
    serviceCharge,
    tax,
    total,
    due,
  };
}

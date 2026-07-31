import { SERVICE_RATE, TAX_RATE } from "@/lib/mock-data";
import type { OrderLine, OrderTotals } from "@/lib/types";

export function computeTotals(
  lines: OrderLine[],
  serviceEnabled: boolean,
): OrderTotals {
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
  const serviceCharge = serviceEnabled ? afterDiscount * SERVICE_RATE : 0;
  const taxable = afterDiscount + serviceCharge;
  const tax = taxable - taxable / (1 + TAX_RATE);
  const total = taxable;
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

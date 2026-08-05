import { getActiveCurrencyCode } from "@/lib/active-currency";
import { currencyLocale, currencySymbol } from "@/lib/currency";
import type { CashEventType, DiningOption } from "@/lib/types";

const DINING_OPTION_LABELS: Record<DiningOption, string> = {
  eat_in: "Eat In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

/** Display label for dining / channel enums (never raw `eat_in`). */
export function diningOptionLabel(option: DiningOption): string {
  return DINING_OPTION_LABELS[option];
}

/** Title-case a snake_case or lowercase token for UI copy. */
export function titleCaseLabel(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function paymentMethodLabel(method: string): string {
  return titleCaseLabel(method);
}

const CASH_EVENT_LABELS: Record<CashEventType, string> = {
  no_sale: "No sale",
  petty_cash: "Petty cash",
  float_adjust: "Float adjust",
  cash_sale: "Cash sale",
};

export function cashEventLabel(type: CashEventType): string {
  return CASH_EVENT_LABELS[type];
}

/** Format a numeric amount with the active restaurant's currency (display only). */
export function formatMoney(amount: number): string {
  const code = getActiveCurrencyCode();
  return new Intl.NumberFormat(currencyLocale(code), {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

/** Active restaurant currency symbol for field labels (not stored in DB). */
export function activeCurrencySymbol(): string {
  return currencySymbol(getActiveCurrencyCode());
}

export function formatTillClock(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date
    .toLocaleString("en-GB", { month: "short" })
    .toUpperCase();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${hours}:${minutes}`;
}

/** Format HH:MM or ISO timestamps for till lists. */
export function formatClockTime(value: string | undefined): string {
  if (!value) return "—";
  if (/^\d{1,2}:\d{2}/.test(value) && Number.isNaN(Date.parse(value))) {
    return value.slice(0, 5);
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Elapsed kitchen time as a live MM:SS (or MMM:SS) clock. */
export function formatElapsedClock(startedAtMs: number, nowMs: number): string {
  const totalSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

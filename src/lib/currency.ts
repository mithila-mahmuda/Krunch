/**
 * Per-restaurant display currency.
 * Money amounts in the DB stay as plain numbers — only the ISO code is stored
 * on settings (`currencyCode`), never symbols like £ / $ / ৳.
 */

export const DEFAULT_CURRENCY_CODE = "GBP";

export const CURRENCY_OPTIONS = [
  { code: "GBP", label: "British Pound (GBP)", locale: "en-GB" },
  { code: "USD", label: "US Dollar (USD)", locale: "en-US" },
  { code: "EUR", label: "Euro (EUR)", locale: "en-IE" },
  { code: "BDT", label: "Bangladeshi Taka (BDT)", locale: "en-BD" },
  { code: "INR", label: "Indian Rupee (INR)", locale: "en-IN" },
  { code: "AED", label: "UAE Dirham (AED)", locale: "en-AE" },
  { code: "AUD", label: "Australian Dollar (AUD)", locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar (CAD)", locale: "en-CA" },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["code"];

const CODE_SET = new Set<string>(CURRENCY_OPTIONS.map((row) => row.code));

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CODE_SET.has(value);
}

export function normalizeCurrencyCode(
  value: string | null | undefined,
): CurrencyCode {
  if (!value) return DEFAULT_CURRENCY_CODE;
  const code = value.trim().toUpperCase();
  return isCurrencyCode(code) ? code : DEFAULT_CURRENCY_CODE;
}

export function currencyLocale(code: string): string {
  const normalized = normalizeCurrencyCode(code);
  return (
    CURRENCY_OPTIONS.find((row) => row.code === normalized)?.locale ?? "en-GB"
  );
}

/** Symbol for labels only — never persist this. */
export function currencySymbol(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  try {
    const parts = new Intl.NumberFormat(currencyLocale(normalized), {
      style: "currency",
      currency: normalized,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? normalized;
  } catch {
    return normalized;
  }
}

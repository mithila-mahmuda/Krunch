import {
  DEFAULT_CURRENCY_CODE,
  normalizeCurrencyCode,
  type CurrencyCode,
} from "@/lib/currency";

/** Sync mirror of the signed-in restaurant's currency for formatMoney. */
let activeCurrencyCode: CurrencyCode = DEFAULT_CURRENCY_CODE;

export function setActiveCurrencyCode(code: string | null | undefined): void {
  activeCurrencyCode = normalizeCurrencyCode(code);
}

export function getActiveCurrencyCode(): CurrencyCode {
  return activeCurrencyCode;
}

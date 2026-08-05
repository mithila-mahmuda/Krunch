import { diningOptionLabel, formatMoney } from "@/lib/format";
import {
  computeTotals,
  getServiceRate,
  getTaxInclusive,
  getTaxRate,
} from "@/lib/order-math";
import type { DiningOption, OrderLine, PaymentResult } from "@/lib/types";
import { useSettingsStore } from "@/store/settings-store";

export interface ReceiptLine {
  quantity: number;
  name: string;
  unitPrice: number;
  total: number;
  note?: string;
}

export interface ReceiptPayment {
  method: "cash" | "card";
  amountPaid: number;
  change: number;
}

export interface ReceiptData {
  v: 2;
  restaurantName: string;
  logoDataUrl?: string | null;
  addressLines: string[];
  phone?: string;
  dateLabel: string;
  timeLabel: string;
  orderNumber: string;
  tableLabel?: string | null;
  server: string;
  diningOptionLabel: string;
  customerName?: string | null;
  billTitle: string;
  lines: ReceiptLine[];
  netTotal: number;
  discount: number;
  serviceCharge: number;
  serviceEnabled: boolean;
  serviceRatePercent: number;
  tax: number;
  taxRatePercent: number;
  taxInclusive: boolean;
  grossTotal: number;
  remainingAmount: number;
  payment?: ReceiptPayment;
  notes?: string;
  footerThankYou: string;
  poweredBy: string;
}

export interface BuildReceiptInput {
  lines: OrderLine[];
  diningOption: DiningOption;
  serviceEnabled: boolean;
  orderNumber: string;
  tableLabel?: string | null;
  customerName?: string | null;
  server: string;
  /** Order placed time (not print/payment “now”). */
  orderedAt?: string | Date;
  payment?: PaymentResult & { change: number };
  restaurantName?: string;
  phone?: string;
  addressLines?: string[];
  logoDataUrl?: string | null;
  taxRate?: number;
  serviceRate?: number;
  taxInclusive?: boolean;
}

export interface RestaurantBrand {
  restaurantName: string;
  phone?: string;
  addressLines: string[];
  logoDataUrl: string | null;
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

const RECEIPT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Order date as DD-MMM-YY (e.g. 06-Aug-26). */
function formatReceiptDate(date: Date): string {
  const day = pad2(date.getDate());
  const month = RECEIPT_MONTHS[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
}

function formatReceiptTime(date: Date): string {
  let hours = date.getHours();
  const minutes = pad2(date.getMinutes());
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

/** Prefer ISO; HH:MM is treated as today. Never silently swap in “now” for a valid clock. */
function resolveReceiptTimestamp(value?: string | Date): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }
  if (!value?.trim()) return new Date();

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  const date = new Date();
  date.setSeconds(0, 0);
  if (match) {
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }
  return date;
}

function percentLabel(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function money(amount: number): string {
  return formatMoney(amount);
}

/** Resolve brand + active branch contact details for receipts. */
export function resolveReceiptBrand(input?: {
  restaurantName?: string;
  phone?: string;
  addressLines?: string[];
  logoDataUrl?: string | null;
}): RestaurantBrand {
  const settings = useSettingsStore.getState();
  const branch = settings.getActiveBranch();
  const brandName = settings.restaurantName.trim();
  const branchName = branch.name.trim();

  const addressFromBranch = (branch.address || settings.restaurantAddress)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Brand on line 1; branch name follows when it adds location context.
  const restaurantName =
    input?.restaurantName?.trim() ||
    (brandName &&
    branchName &&
    branchName.toLowerCase() !== "main" &&
    !brandName.toLowerCase().includes(branchName.toLowerCase())
      ? `${brandName} · ${branchName}`
      : brandName || branchName || "Your Restaurant");

  const phone =
    input?.phone?.trim() ||
    branch.phone.trim() ||
    settings.restaurantPhone.trim() ||
    undefined;

  const addressLines =
    input?.addressLines && input.addressLines.length > 0
      ? input.addressLines.filter(Boolean)
      : addressFromBranch;

  const logoDataUrl =
    input?.logoDataUrl !== undefined
      ? input.logoDataUrl
      : settings.restaurantLogoDataUrl;

  return {
    restaurantName,
    phone,
    addressLines,
    logoDataUrl,
  };
}

export function buildReceiptData(input: BuildReceiptInput): ReceiptData {
  const taxRate = input.taxRate ?? getTaxRate();
  const serviceRate = input.serviceRate ?? getServiceRate();
  const taxInclusive = input.taxInclusive ?? getTaxInclusive();
  const totals = computeTotals(input.lines, input.serviceEnabled, {
    taxRate,
    serviceRate,
    taxInclusive,
  });
  const orderedAt = resolveReceiptTimestamp(input.orderedAt);
  const brand = resolveReceiptBrand({
    restaurantName: input.restaurantName,
    phone: input.phone,
    addressLines: input.addressLines,
    logoDataUrl: input.logoDataUrl,
  });

  const netTotal = Math.max(0, totals.subtotal - totals.totalDiscount);
  const isPaid = Boolean(input.payment);
  const remainingAmount = isPaid
    ? 0
    : Math.round(totals.total * 100) / 100;

  return {
    v: 2,
    restaurantName: brand.restaurantName,
    logoDataUrl: brand.logoDataUrl,
    addressLines: brand.addressLines,
    phone: brand.phone,
    dateLabel: formatReceiptDate(orderedAt),
    timeLabel: formatReceiptTime(orderedAt),
    orderNumber: input.orderNumber,
    tableLabel: input.tableLabel,
    server: input.server,
    diningOptionLabel: diningOptionLabel(input.diningOption),
    customerName: input.customerName,
    billTitle: isPaid ? "Receipt" : "Bill",
    lines: input.lines.map((line) => ({
      quantity: line.quantity,
      name: line.name,
      unitPrice: line.unitPrice,
      total: line.unitPrice * line.quantity - line.discountAmount,
      note: line.note,
    })),
    netTotal,
    discount: totals.totalDiscount,
    serviceCharge: totals.serviceCharge,
    serviceEnabled: input.serviceEnabled,
    serviceRatePercent: serviceRate * 100,
    tax: totals.tax,
    taxRatePercent: taxRate * 100,
    taxInclusive,
    grossTotal: totals.total,
    remainingAmount,
    payment: input.payment
      ? {
          method: input.payment.method,
          amountPaid: input.payment.amountPaid,
          change: input.payment.change,
        }
      : undefined,
    notes: undefined,
    footerThankYou: "THANK YOU, COME AGAIN",
    poweredBy: "Powered by: Krunch",
  };
}

export function serializeReceipt(data: ReceiptData): string {
  return JSON.stringify(data);
}

export function parseReceipt(raw: string | null | undefined): ReceiptData | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as ReceiptData;
    if (parsed?.v === 2 && typeof parsed.restaurantName === "string") {
      return {
        ...parsed,
        taxInclusive: parsed.taxInclusive !== false,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function isStructuredReceipt(raw: string | null | undefined): boolean {
  return parseReceipt(raw) !== null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dashedRule(): string {
  return `<div class="rule" aria-hidden="true"></div>`;
}

function doubleRule(): string {
  return `<div class="rule double" aria-hidden="true"></div>`;
}

function pairRow(left: string, right: string, strong = false): string {
  return `<div class="row${strong ? " strong" : ""}"><span>${escapeHtml(left)}</span><span>${escapeHtml(right)}</span></div>`;
}

export function renderReceiptBodyHtml(data: ReceiptData): string {
  const address = data.addressLines
    .map((line) => `<div class="muted">${escapeHtml(line)}</div>`)
    .join("");
  const phone = data.phone
    ? `<div class="muted">Phone# ${escapeHtml(data.phone)}</div>`
    : "";

  const itemRows =
    data.lines.length > 0
      ? data.lines
          .map((line) => {
            const note = line.note
              ? `<div class="note">${escapeHtml(line.note)}</div>`
              : "";
            return `<div class="item-row">
  <span class="qty">${line.quantity}</span>
  <span class="name">${escapeHtml(line.name)}${note}</span>
  <span class="price">${escapeHtml(money(line.unitPrice))}</span>
  <span class="tprice">${escapeHtml(money(line.total))}</span>
</div>`;
          })
          .join("")
      : `<div class="muted center">No items</div>`;

  const paymentBlock = data.payment
    ? [
        pairRow(
          `${data.payment.method === "card" ? "Card" : "Cash"} Paid:`,
          money(data.payment.amountPaid),
        ),
        data.payment.change > 0
          ? pairRow("Change:", money(data.payment.change))
          : "",
      ].join("")
    : pairRow("REMAINING AMOUNT:", money(data.remainingAmount), true);

  const logo = data.logoDataUrl
    ? `<img class="logo" src="${escapeHtml(data.logoDataUrl)}" alt="${escapeHtml(data.restaurantName)}" />`
    : `<div class="brand">${escapeHtml(data.restaurantName)}</div>`;

  return `
<section class="ticket">
  <header class="center">
    ${logo}
    ${address}
    ${phone}
  </header>
  ${dashedRule()}
  <div class="stack">
    <div>Table: ${escapeHtml(data.tableLabel || data.diningOptionLabel)}</div>
    <div>Waiter: ${escapeHtml(data.server)}</div>
  </div>
  <div class="bill-bar">${escapeHtml(data.billTitle)}</div>
  <div class="stack">
    ${pairRow(`Date: ${data.dateLabel}`, `Time: ${data.timeLabel}`)}
    <div>Order No: ${escapeHtml(data.orderNumber)}</div>
  </div>
  ${dashedRule()}
  <div class="item-head">
    <span class="qty">Qty</span>
    <span class="name">Item Name</span>
    <span class="price">Price</span>
    <span class="tprice">T.Price</span>
  </div>
  ${dashedRule()}
  <div class="items">${itemRows}</div>
  ${dashedRule()}
  ${pairRow("Net Total:", money(data.netTotal))}
  ${data.discount > 0 ? pairRow("Discount:", `-${money(data.discount)}`) : ""}
  ${
    data.serviceEnabled
      ? pairRow(
          `Service Charge-${percentLabel(data.serviceRatePercent / 100)}:`,
          money(data.serviceCharge),
        )
      : ""
  }
  ${pairRow(
    data.taxInclusive
      ? `Vat-${percentLabel(data.taxRatePercent / 100)} (incl.):`
      : `Vat-${percentLabel(data.taxRatePercent / 100)}:`,
    money(data.tax),
  )}
  ${doubleRule()}
  ${pairRow("Gross Total:", money(data.grossTotal), true)}
  ${doubleRule()}
  ${paymentBlock}
  ${doubleRule()}
  <div class="notes">Notes: ${escapeHtml(data.notes || "")}</div>
  ${dashedRule()}
  <footer class="center">
    <p class="thanks">${escapeHtml(data.footerThankYou)}</p>
    <p class="powered">${escapeHtml(data.poweredBy)}</p>
  </footer>
</section>`;
}

export function receiptPrintStyles(): string {
  return `
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #ececec;
      color: #111;
      font-family: "Courier New", Courier, ui-monospace, monospace;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 2mm 3mm 4mm;
      background: #fff;
    }
    .ticket { width: 100%; font-size: 11px; line-height: 1.35; }
    .center { text-align: center; }
    .brand {
      display: inline-block;
      margin: 0 auto 8px;
      padding: 8px 14px;
      background: #111;
      color: #fff;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .logo {
      display: block;
      max-width: 120px;
      max-height: 56px;
      width: auto;
      height: auto;
      margin: 0 auto 6px;
      object-fit: contain;
    }
    .name {
      margin: 0 0 6px;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .muted { font-size: 10px; line-height: 1.4; }
    .rule {
      width: 100%;
      margin: 8px 0;
      border-top: 1px dashed #262626;
    }
    .rule.double {
      border-top: none;
      border-bottom: none;
      height: 5px;
      background:
        linear-gradient(#171717, #171717) top / 100% 1px no-repeat,
        linear-gradient(#171717, #171717) bottom / 100% 1px no-repeat;
    }
    .stack { display: grid; gap: 3px; }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .row.strong { font-weight: 700; }
    .bill-bar {
      margin: 8px 0;
      padding: 4px 6px;
      background: #d9d9d9;
      text-align: center;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .item-head, .item-row {
      display: grid;
      grid-template-columns: 28px 1fr 64px 68px;
      gap: 4px;
      align-items: start;
    }
    .item-head { font-weight: 700; }
    .price, .tprice { text-align: right; white-space: nowrap; }
    .qty { text-align: left; }
    .note { font-size: 10px; opacity: 0.85; }
    .notes { margin: 4px 0; min-height: 1.2em; }
    footer p { margin: 4px 0 0; }
    .thanks { font-weight: 700; letter-spacing: 0.03em; }
    .powered { font-size: 10px; }
    @media print {
      body { background: #fff; }
      .sheet {
        width: 80mm;
        max-width: 80mm;
        margin: 0;
        padding: 2mm 3mm 4mm;
      }
    }
  `;
}

export function renderReceiptDocumentHtml(data: ReceiptData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.restaurantName)} receipt</title>
  <style>${receiptPrintStyles()}</style>
</head>
<body>
  <div class="sheet">
    ${renderReceiptBodyHtml(data)}
  </div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;
}

export function renderPlainReceiptDocumentHtml(receipt: string): string {
  const escaped = escapeHtml(receipt);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Krunch receipt</title>
  <style>
    @page { margin: 12mm; }
    body {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.45;
      color: #0f172a;
    }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <pre>${escaped}</pre>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;
}

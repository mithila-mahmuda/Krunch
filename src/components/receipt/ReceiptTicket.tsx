"use client";

import { formatMoney } from "@/lib/format";
import { parseReceipt, type ReceiptData } from "@/lib/receipt";

function DashedRule() {
  return (
    <div
      className="my-2 w-full border-t border-dashed border-neutral-800"
      aria-hidden="true"
    />
  );
}

function DoubleRule() {
  return (
    <div className="my-2 w-full" aria-hidden="true">
      <div className="border-t border-neutral-900" />
      <div className="mt-0.5 border-t border-neutral-900" />
    </div>
  );
}

function PairRow({
  left,
  right,
  strong = false,
}: {
  left: string;
  right: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-2 text-[11px] leading-snug ${
        strong ? "font-bold" : "font-medium"
      }`}
    >
      <span className="min-w-0">{left}</span>
      <span className="shrink-0">{right}</span>
    </div>
  );
}

function percentLabel(percent: number): string {
  return `${percent.toFixed(2)}%`;
}

function ReceiptBody({ data }: { data: ReceiptData }) {
  return (
    <article className="font-mono text-[11px] leading-snug text-neutral-900">
      <header className="text-center">
        {data.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- receipt logo is a local data URL
          <img
            src={data.logoDataUrl}
            alt={data.restaurantName}
            className="mx-auto mb-1.5 max-h-[56px] max-w-[120px] object-contain"
          />
        ) : (
          <div className="mx-auto inline-block bg-neutral-900 px-3.5 py-2 text-[17px] font-extrabold tracking-[0.08em] text-white uppercase">
            {data.restaurantName}
          </div>
        )}
        {data.addressLines.map((line) => (
          <p key={line} className="mt-0.5 text-[10px] leading-snug">
            {line}
          </p>
        ))}
        {data.phone ? (
          <p className="mt-0.5 text-[10px] leading-snug">Phone# {data.phone}</p>
        ) : null}
      </header>

      <DashedRule />

      <div className="space-y-0.5 text-[11px] leading-snug font-medium">
        <p>Table: {data.tableLabel || data.diningOptionLabel}</p>
        <p>Waiter: {data.server}</p>
      </div>

      <div className="my-2 bg-neutral-300 px-2 py-1 text-center text-[11px] font-bold tracking-wide">
        {data.billTitle}
      </div>

      <div className="space-y-0.5">
        <PairRow
          left={`Date: ${data.dateLabel}`}
          right={`Time: ${data.timeLabel}`}
        />
        <p className="text-[11px] leading-snug font-medium">
          Order No: {data.orderNumber}
        </p>
      </div>

      <DashedRule />

      <div className="grid grid-cols-[28px_1fr_64px_68px] gap-1 text-[11px] font-bold">
        <span>Qty</span>
        <span>Item Name</span>
        <span className="text-right">Price</span>
        <span className="text-right">T.Price</span>
      </div>

      <DashedRule />

      <div className="space-y-1">
        {data.lines.length === 0 ? (
          <p className="text-center text-[10px]">No items</p>
        ) : (
          data.lines.map((line, index) => (
            <div key={`${line.name}-${index}`}>
              <div className="grid grid-cols-[28px_1fr_64px_68px] gap-1 text-[11px]">
                <span>{line.quantity}</span>
                <span className="min-w-0 break-words">{line.name}</span>
                <span className="text-right whitespace-nowrap">
                  {formatMoney(line.unitPrice)}
                </span>
                <span className="text-right whitespace-nowrap">
                  {formatMoney(line.total)}
                </span>
              </div>
              {line.note ? (
                <p className="pl-7 text-[10px] text-neutral-600">{line.note}</p>
              ) : null}
            </div>
          ))
        )}
      </div>

      <DashedRule />
      <PairRow left="Net Total:" right={formatMoney(data.netTotal)} />
      {data.discount > 0 ? (
        <PairRow left="Discount:" right={`-${formatMoney(data.discount)}`} />
      ) : null}
      {data.serviceEnabled ? (
        <PairRow
          left={`Service Charge-${percentLabel(data.serviceRatePercent)}:`}
          right={formatMoney(data.serviceCharge)}
        />
      ) : null}
      <PairRow
        left={
          data.taxInclusive
            ? `Vat-${percentLabel(data.taxRatePercent)} (incl.):`
            : `Vat-${percentLabel(data.taxRatePercent)}:`
        }
        right={formatMoney(data.tax)}
      />

      <DoubleRule />
      <PairRow left="Gross Total:" right={formatMoney(data.grossTotal)} strong />
      <DoubleRule />

      {data.payment ? (
        <div className="space-y-0.5">
          <PairRow
            left={`${data.payment.method === "card" ? "Card" : "Cash"} Paid:`}
            right={formatMoney(data.payment.amountPaid)}
          />
          {data.payment.change > 0 ? (
            <PairRow left="Change:" right={formatMoney(data.payment.change)} />
          ) : null}
        </div>
      ) : (
        <PairRow
          left="REMAINING AMOUNT:"
          right={formatMoney(data.remainingAmount)}
          strong
        />
      )}

      <DoubleRule />

      <p className="min-h-[1.2em]">Notes: {data.notes || ""}</p>
      <DashedRule />

      <footer className="text-center">
        <p className="font-bold tracking-wide">{data.footerThankYou}</p>
        <p className="mt-1 text-[10px]">{data.poweredBy}</p>
      </footer>
    </article>
  );
}

export function ReceiptTicket({
  receipt,
  className = "",
}: {
  receipt: string;
  className?: string;
}) {
  const data = parseReceipt(receipt);

  if (!data) {
    return (
      <pre
        className={`receipt-ticket rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800 ${className}`}
      >
        {receipt}
      </pre>
    );
  }

  return (
    <div
      className={`receipt-ticket mx-auto rounded-sm border border-neutral-300 bg-white px-2 py-3 shadow-sm ${className}`}
      style={{ width: "80mm", maxWidth: "100%" }}
    >
      <ReceiptBody data={data} />
    </div>
  );
}

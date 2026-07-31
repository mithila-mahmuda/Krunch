"use client";

import { formatMoney } from "@/lib/format";
import { REPORT_SUMMARY } from "@/lib/module-data";
import { ModuleShell } from "@/components/modules/ModuleShell";

export function ReportsScreen() {
  const report = REPORT_SUMMARY;
  const maxHourly = Math.max(...report.hourly.map((row) => row.sales));

  return (
    <ModuleShell
      title="Reports"
      subtitle={`${report.dateLabel}'s sales snapshot`}
    >
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
          <div className="mt-4 flex h-44 items-end gap-2">
            {report.hourly.map((row) => (
              <div
                key={row.hour}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t bg-[var(--pos-menu)]"
                  style={{
                    height: `${Math.max(8, (row.sales / maxHourly) * 100)}%`,
                  }}
                  title={formatMoney(row.sales)}
                />
                <span className="text-[11px] font-semibold text-slate-500">
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
    </ModuleShell>
  );
}

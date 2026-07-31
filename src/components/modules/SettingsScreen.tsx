"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_STAFF } from "@/lib/staff";
import { TAX_RATE, SERVICE_RATE, TILL_NAME } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { ModuleShell } from "@/components/modules/ModuleShell";

export function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const [tillName, setTillName] = useState(TILL_NAME);
  const [taxPercent, setTaxPercent] = useState(TAX_RATE * 100);
  const [servicePercent, setServicePercent] = useState(SERVICE_RATE * 100);
  const [serviceDefault, setServiceDefault] = useState(false);
  const [kitchenSound, setKitchenSound] = useState(true);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <ModuleShell title="Settings" subtitle="Till, tax, and staff preferences">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Till
          </h2>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Till name
            <input
              value={tillName}
              onChange={(event) => setTillName(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-medium outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-slate-700">
              Tax %
              <input
                type="number"
                min={0}
                step={0.1}
                value={taxPercent}
                onChange={(event) =>
                  setTaxPercent(Number(event.target.value) || 0)
                }
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-medium outline-none ring-[var(--pos-accent)] focus:ring-2"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Service %
              <input
                type="number"
                min={0}
                step={0.1}
                value={servicePercent}
                onChange={(event) =>
                  setServicePercent(Number(event.target.value) || 0)
                }
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-medium outline-none ring-[var(--pos-accent)] focus:ring-2"
              />
            </label>
          </div>
          <label className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold">
            Service charge on by default
            <input
              type="checkbox"
              checked={serviceDefault}
              onChange={(event) => setServiceDefault(event.target.checked)}
              className="h-4 w-4"
            />
          </label>
          <label className="mt-2 flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold">
            Kitchen bump sound
            <input
              type="checkbox"
              checked={kitchenSound}
              onChange={(event) => setKitchenSound(event.target.checked)}
              className="h-4 w-4"
            />
          </label>
          <button
            type="button"
            onClick={save}
            className="mt-4 min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white hover:brightness-110"
          >
            {saved ? "Saved" : "Save settings"}
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Session & staff
          </h2>
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
            <p className="font-bold">{user?.name ?? "Staff"}</p>
            <p className="text-slate-500">{user?.email}</p>
            <p className="mt-1 capitalize text-slate-600">
              Role: {user?.role ?? "—"}
              {user?.restaurantName
                ? ` · ${user.restaurantName}`
                : ""}
            </p>
          </div>

          <ul className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            {DEMO_STAFF.map((staff) => (
              <li
                key={staff.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold">{staff.name}</p>
                  <p className="text-slate-500">{staff.email}</p>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-600">
                  {staff.role}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            className="mt-4 min-h-11 w-full rounded-md border border-rose-300 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            Sign out
          </button>
        </section>
      </div>
    </ModuleShell>
  );
}

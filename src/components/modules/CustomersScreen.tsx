"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { PosDialog } from "@/components/pos/PosDialog";
import { useCustomerStore } from "@/store/customer-store";
import { usePosStore } from "@/store/pos-store";

export function CustomersScreen() {
  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const attachCustomer = usePosStore((state) => state.attachCustomer);
  const attachedId = usePosStore((state) => state.customerId);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customers[0]?.id ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.phone.includes(q),
    );
  }, [customers, query]);

  const selected =
    filtered.find((customer) => customer.id === selectedId) ??
    filtered[0] ??
    null;

  return (
    <ModuleShell
      title="Customers"
      subtitle="Look up guests, add new customers, and attach loyalty"
      actions={
        <button
          type="button"
          onClick={() => {
            setError("");
            setName("");
            setEmail("");
            setPhone("");
            setNotes("");
            setAddOpen(true);
          }}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[var(--pos-header)] px-3 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add customer
        </button>
      }
    >
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, or phone"
          className="min-h-11 w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-2">
          {filtered.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => setSelectedId(customer.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                selected?.id === customer.id
                  ? "border-[var(--pos-accent)] bg-[var(--pos-accent-soft)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{customer.name}</p>
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--pos-accent)]">
                  {customer.loyaltyPoints} pts
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No customers match that search.
            </p>
          ) : null}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          {selected ? (
            <>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {selected.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">{selected.email}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-slate-500">Visits</dt>
                  <dd className="text-lg font-bold">{selected.visits}</dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-slate-500">Loyalty</dt>
                  <dd className="text-lg font-bold">
                    {selected.loyaltyPoints}
                  </dd>
                </div>
                <div className="col-span-2 rounded-md bg-slate-50 p-3">
                  <dt className="text-slate-500">Last visit</dt>
                  <dd className="font-semibold">{selected.lastVisit}</dd>
                </div>
              </dl>
              {selected.notes ? (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {selected.notes}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  attachCustomer(
                    attachedId === selected.id
                      ? null
                      : { id: selected.id, name: selected.name },
                  )
                }
                className="mt-5 min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white hover:brightness-110"
              >
                {attachedId === selected.id
                  ? "Attached to ticket"
                  : "Attach to current ticket"}
              </button>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              Select a customer.
            </p>
          )}
        </aside>
      </div>

      <PosDialog
        open={addOpen}
        title="Add customer"
        onClose={() => setAddOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              const result = addCustomer({ name, email, phone, notes });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setSelectedId(result.customer.id);
              setAddOpen(false);
            }}
            className="min-h-11 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-white"
          >
            Save customer
          </button>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-semibold">
            Name *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
              autoFocus
            />
          </label>
          <label className="block text-sm font-semibold">
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Notes
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      </PosDialog>
    </ModuleShell>
  );
}

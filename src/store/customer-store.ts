"use client";

import { create } from "zustand";
import {
  INITIAL_CUSTOMERS,
  type CustomerRecord,
} from "@/lib/module-data";

interface CustomerState {
  customers: CustomerRecord[];
  addCustomer: (input: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => { ok: true; customer: CustomerRecord } | { ok: false; error: string };
  updateCustomer: (
    id: string,
    patch: Partial<Pick<CustomerRecord, "name" | "email" | "phone" | "notes">>,
  ) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: INITIAL_CUSTOMERS,

  addCustomer: (input) => {
    const name = input.name.trim();
    if (name.length < 2) {
      return { ok: false, error: "Enter a customer name." };
    }

    const email = (input.email ?? "").trim().toLowerCase();
    const phone = (input.phone ?? "").trim();
    const notes = (input.notes ?? "").trim() || undefined;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Enter a valid email address." };
    }

    const duplicate = get().customers.find(
      (customer) =>
        (email && customer.email === email) ||
        (phone && customer.phone === phone && phone.length > 0),
    );
    if (duplicate) {
      return {
        ok: false,
        error: "A customer with that email or phone already exists.",
      };
    }

    const customer: CustomerRecord = {
      id: `c_${Date.now().toString(36)}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@guest.local`,
      phone: phone || "—",
      visits: 0,
      loyaltyPoints: 0,
      lastVisit: "Today",
      notes,
    };

    set((state) => ({ customers: [customer, ...state.customers] }));
    return { ok: true, customer };
  },

  updateCustomer: (id, patch) => {
    set((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === id ? { ...customer, ...patch } : customer,
      ),
    }));
  },
}));

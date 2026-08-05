"use client";

import { create } from "zustand";
import { loadCustomers, saveCustomers } from "@/lib/db/repos";
import { queueDbWrite } from "@/lib/db/write";
import {
  INITIAL_CUSTOMERS,
  type CustomerRecord,
} from "@/lib/module-data";
import { DEMO_RESTAURANT_ID, tenantEntityId } from "@/lib/tenant";

export type CustomerWriteInput = {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type CustomerWriteResult =
  | { ok: true; customer: CustomerRecord }
  | { ok: false; error: string };

interface CustomerState {
  restaurantId: string | null;
  customers: CustomerRecord[];
  hydrated: boolean;
  hydrateForRestaurant: (restaurantId: string) => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
  addCustomer: (input: CustomerWriteInput) => CustomerWriteResult;
  updateCustomer: (
    id: string,
    input: CustomerWriteInput,
  ) => CustomerWriteResult;
  recordVisit: (id: string, spend: number) => void;
}

function seedCustomers(restaurantId: string): CustomerRecord[] {
  if (restaurantId !== DEMO_RESTAURANT_ID) return [];
  return INITIAL_CUSTOMERS.map((customer) => ({
    ...customer,
    id: tenantEntityId(restaurantId, customer.id),
    restaurantId,
  }));
}

function normalizeContact(input: CustomerWriteInput) {
  return {
    name: input.name.trim(),
    email: (input.email ?? "").trim().toLowerCase(),
    phone: (input.phone ?? "").trim(),
    notes: (input.notes ?? "").trim() || undefined,
  };
}

function validateContact(
  customers: CustomerRecord[],
  input: ReturnType<typeof normalizeContact>,
  excludeId?: string,
): string | null {
  if (input.name.length < 2) {
    return "Enter a customer name.";
  }

  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Enter a valid email address.";
  }

  const duplicate = customers.find(
    (customer) =>
      customer.id !== excludeId &&
      ((input.email && customer.email === input.email) ||
        (input.phone.length > 0 && customer.phone === input.phone)),
  );
  if (duplicate) {
    return "A customer with that email or phone already exists.";
  }

  return null;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  restaurantId: null,
  customers: [],
  hydrated: false,

  hydrateForRestaurant: async (restaurantId) => {
    if (get().hydrated && get().restaurantId === restaurantId) return;
    const stored = await loadCustomers(restaurantId);
    const seed = seedCustomers(restaurantId);
    set({
      restaurantId,
      customers: stored.length > 0 ? stored : seed,
      hydrated: true,
    });
    if (stored.length === 0 && seed.length > 0) {
      get().persist();
    }
  },

  hydrate: async () => {
    await get().hydrateForRestaurant(get().restaurantId ?? DEMO_RESTAURANT_ID);
  },

  persist: () => {
    if (!get().hydrated) return;
    const restaurantId = get().restaurantId;
    if (!restaurantId) return;
    queueDbWrite(
      () => saveCustomers(restaurantId, get().customers),
      "save customers",
    );
  },

  addCustomer: (input) => {
    const contact = normalizeContact(input);
    const error = validateContact(get().customers, contact);
    if (error) return { ok: false, error };

    const restaurantId = get().restaurantId ?? DEMO_RESTAURANT_ID;
    const customer: CustomerRecord = {
      id: tenantEntityId(restaurantId, `c_${Date.now().toString(36)}`),
      restaurantId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "—",
      visits: 0,
      loyaltyPoints: 0,
      lastVisit: "Today",
      notes: contact.notes,
    };

    set((state) => ({ customers: [customer, ...state.customers] }));
    get().persist();
    return { ok: true, customer };
  },

  updateCustomer: (id, input) => {
    const existing = get().customers.find((customer) => customer.id === id);
    if (!existing) {
      return { ok: false, error: "Customer not found." };
    }

    const contact = normalizeContact(input);
    const error = validateContact(get().customers, contact, id);
    if (error) return { ok: false, error };

    const customer: CustomerRecord = {
      ...existing,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "—",
      notes: contact.notes,
    };

    set((state) => ({
      customers: state.customers.map((item) =>
        item.id === id ? customer : item,
      ),
    }));
    get().persist();
    return { ok: true, customer };
  },

  recordVisit: (id, spend) => {
    const points = Math.max(1, Math.round(spend));
    set((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              visits: customer.visits + 1,
              loyaltyPoints: customer.loyaltyPoints + points,
              lastVisit: "Today",
            }
          : customer,
      ),
    }));
    get().persist();
  },
}));

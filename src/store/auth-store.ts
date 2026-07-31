"use client";

import { create } from "zustand";
import {
  createRestaurantAccount,
  findRestaurantByCredentials,
  type RestaurantAccount,
} from "@/lib/restaurants";
import { DEMO_STAFF, findStaffByCredentials, type StaffUser } from "@/lib/staff";

const STORAGE_KEY = "krunch-auth";

interface AuthSession {
  id: string;
  name: string;
  email: string;
  role: StaffUser["role"];
  restaurantName?: string;
}

interface AuthState {
  user: AuthSession | null;
  hydrated: boolean;
  hydrate: () => void;
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signInWithGoogle: () => { ok: true } | { ok: false; error: string };
  signUp: (input: {
    restaurantName: string;
    ownerName: string;
    email: string;
    contactNumber: string;
    password: string;
  }) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
}

function toStaffSession(user: StaffUser): AuthSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function toOwnerSession(account: RestaurantAccount): AuthSession {
  return {
    id: account.id,
    name: account.ownerName,
    email: account.email,
    role: "manager",
    restaurantName: account.restaurantName,
  };
}

function persistSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.id || !parsed?.name || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrate: () => {
    set({ user: readStoredSession(), hydrated: true });
  },

  signIn: (email, password) => {
    const staff = findStaffByCredentials(email, password);
    if (staff) {
      const session = toStaffSession(staff);
      persistSession(session);
      set({ user: session, hydrated: true });
      return { ok: true };
    }

    const restaurant = findRestaurantByCredentials(email, password);
    if (restaurant) {
      const session = toOwnerSession(restaurant);
      persistSession(session);
      set({ user: session, hydrated: true });
      return { ok: true };
    }

    return { ok: false, error: "Invalid email or password." };
  },

  signInWithGoogle: () => {
    // Demo: Google OAuth will connect to Supabase in a later phase.
    const staff = DEMO_STAFF[0];
    if (!staff) {
      return { ok: false, error: "Google sign-in is unavailable right now." };
    }

    const session = toStaffSession(staff);
    persistSession(session);
    set({ user: session, hydrated: true });
    return { ok: true };
  },

  signUp: (input) => {
    const result = createRestaurantAccount(input);
    if (!result.ok) return result;

    const session = toOwnerSession(result.account);
    persistSession(session);
    set({ user: session, hydrated: true });
    return { ok: true };
  },

  signOut: () => {
    window.localStorage.removeItem(STORAGE_KEY);
    set({ user: null, hydrated: true });
  },
}));

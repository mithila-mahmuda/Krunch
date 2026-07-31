"use client";

import { create } from "zustand";
import { findStaffByCredentials, type StaffUser } from "@/lib/staff";

const STORAGE_KEY = "krunch-auth";

interface AuthSession {
  id: string;
  name: string;
  email: string;
  role: StaffUser["role"];
}

interface AuthState {
  user: AuthSession | null;
  hydrated: boolean;
  hydrate: () => void;
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
}

function toSession(user: StaffUser): AuthSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
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
    if (!staff) {
      return { ok: false, error: "Invalid email or password." };
    }

    const session = toSession(staff);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    set({ user: session, hydrated: true });
    return { ok: true };
  },

  signOut: () => {
    window.localStorage.removeItem(STORAGE_KEY);
    set({ user: null, hydrated: true });
  },
}));

"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import {
  clearAuthSession,
  loadAllStaffUsers,
  loadAuthSession,
  saveAuthSession,
} from "@/lib/db/repos";
import { queueDbWrite } from "@/lib/db/write";
import {
  createRestaurantAccount,
  findRestaurantByCredentials,
  hydrateRestaurantAccounts,
  type RestaurantAccount,
} from "@/lib/restaurants";
import { ALL_BRANCHES_ID, hasAllBranchAccess } from "@/lib/branch-access";
import { DEMO_RESTAURANT_ID, roleIdForRestaurant } from "@/lib/tenant";
import type { StaffRole, StaffUser } from "@/lib/staff";
import { useStaffStore } from "@/store/staff-store";

/** Lazy — avoids auth ↔ workspace ↔ settings import cycle. */
async function workspaceApi() {
  return import("@/lib/workspace");
}

/** Sync mirror so full reloads don't flash the auth gate while IndexedDB opens. */
const AUTH_SESSION_CACHE_KEY = "krunch-auth-session";

interface AuthSession {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  restaurantId: string;
  restaurantName?: string;
  mobile?: string;
  /** Admin-assigned branch — not self-selected. */
  branchId?: string;
  activeBranchId?: string;
  activeTillId?: string;
}

interface AuthState {
  user: AuthSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithGoogle: () => Promise<
    { ok: true } | { ok: false; error: string }
  >;
  signUp: (input: {
    restaurantName: string;
    ownerName: string;
    email: string;
    contactNumber: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  patchLocation: (activeBranchId: string, activeTillId: string) => void;
  refreshAssignedBranch: () => void;
  signOut: () => void;
}

type AuthStore = UseBoundStore<StoreApi<AuthState>>;

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.email === "string" &&
    typeof row.role === "string"
  );
}

function readSessionCache(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAuthSession(parsed)) return null;
    const restaurantId =
      typeof parsed.restaurantId === "string"
        ? parsed.restaurantId
        : parsed.id.startsWith("rest_")
          ? parsed.id
          : DEMO_RESTAURANT_ID;
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role as StaffRole,
      restaurantId,
      restaurantName:
        typeof parsed.restaurantName === "string"
          ? parsed.restaurantName
          : undefined,
      mobile: typeof parsed.mobile === "string" ? parsed.mobile : undefined,
      branchId:
        typeof parsed.branchId === "string" ? parsed.branchId : undefined,
      activeBranchId:
        typeof parsed.activeBranchId === "string"
          ? parsed.activeBranchId
          : undefined,
      activeTillId:
        typeof parsed.activeTillId === "string"
          ? parsed.activeTillId
          : undefined,
    };
  } catch {
    return null;
  }
}

function writeSessionCache(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(AUTH_SESSION_CACHE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_CACHE_KEY);
    }
  } catch {
    // Private mode / quota — IndexedDB remains the source of truth.
  }
}

function toStaffSession(user: StaffUser): AuthSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
    mobile: user.mobile,
    branchId: user.branchId,
    // All-branch users keep their last working location via bindToAccount prefs.
    activeBranchId: hasAllBranchAccess(user.branchId)
      ? undefined
      : user.branchId,
  };
}

function toOwnerSession(account: RestaurantAccount): AuthSession {
  return {
    id: account.id,
    name: account.ownerName,
    email: account.email,
    role: roleIdForRestaurant(account.id, "admin"),
    restaurantId: account.id,
    restaurantName: account.restaurantName,
    mobile: account.contactNumber,
    branchId: ALL_BRANCHES_ID,
  };
}

function persistSession(session: AuthSession) {
  writeSessionCache(session);
  queueDbWrite(
    () =>
      saveAuthSession({
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        restaurantId: session.restaurantId,
        restaurantName: session.restaurantName,
        activeBranchId: session.activeBranchId ?? session.branchId,
        activeTillId: session.activeTillId,
      }),
    "save auth session",
  );
}

function sessionFromRow(
  session: Awaited<ReturnType<typeof loadAuthSession>>,
): AuthSession | null {
  if (!session) return null;
  const restaurantId =
    session.restaurantId ||
    (session.id.startsWith("rest_") ? session.id : DEMO_RESTAURANT_ID);
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role as StaffRole,
    restaurantId,
    restaurantName: session.restaurantName,
    activeBranchId: session.activeBranchId,
    activeTillId: session.activeTillId,
    branchId: session.activeBranchId,
  };
}

function bindStaffLocation(staff: StaffUser) {
  void import("@/store/settings-store").then(({ useSettingsStore }) => {
    useSettingsStore.getState().bindToAccount(staff.id, {
      branchId: staff.branchId,
    });
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createAuthStore(): AuthStore {
  const cached = readSessionCache();
  let idbReady = false;

  return create<AuthState>((set, get) => ({
    user: cached,
    hydrated: cached !== null,

    hydrate: async () => {
      if (idbReady) return;
      const { ensureDemoRestaurantAccount } = await workspaceApi();
      await hydrateRestaurantAccounts();
      await ensureDemoRestaurantAccount();
      const session = sessionFromRow(await loadAuthSession());
      if (idbReady) return;
      idbReady = true;
      writeSessionCache(session);
      set({ user: session, hydrated: true });
    },

    signIn: async (email, password) => {
      const { ensureDemoRestaurantAccount, loadRestaurantWorkspace } =
        await workspaceApi();
      await hydrateRestaurantAccounts();
      await ensureDemoRestaurantAccount();
      // First-run: persist demo seed staff so Kyle/Maya exist in IDB.
      await loadRestaurantWorkspace(DEMO_RESTAURANT_ID);

      const normalized = normalizeEmail(email);
      let allStaff = await loadAllStaffUsers();
      // Stamp legacy rows missing restaurantId so login can bind a tenant.
      if (allStaff.some((row) => !row.restaurantId)) {
        allStaff = allStaff.map((row) =>
          row.restaurantId
            ? row
            : { ...row, restaurantId: DEMO_RESTAURANT_ID },
        );
      }

      const staff =
        allStaff.find(
          (row) =>
            !row.archived &&
            normalizeEmail(row.email) === normalized &&
            row.password === password,
        ) ?? null;

      if (staff) {
        const restaurantId = staff.restaurantId || DEMO_RESTAURANT_ID;
        await loadRestaurantWorkspace(restaurantId, { force: true });
        const live =
          useStaffStore.getState().findById(staff.id) ?? {
            ...staff,
            restaurantId,
          };
        const session = toStaffSession(live);
        idbReady = true;
        persistSession(session);
        set({ user: session, hydrated: true });
        bindStaffLocation(live);
        return { ok: true };
      }

      const restaurant = findRestaurantByCredentials(email, password);
      if (restaurant) {
        await loadRestaurantWorkspace(restaurant.id, { force: true });
        const session = toOwnerSession(restaurant);
        idbReady = true;
        persistSession(session);
        set({ user: session, hydrated: true });
        void import("@/store/settings-store").then(({ useSettingsStore }) => {
          useSettingsStore.getState().bindToAccount(session.id, {
            branchId: ALL_BRANCHES_ID,
          });
        });
        return { ok: true };
      }

      return { ok: false, error: "Invalid email or password." };
    },

    signInWithGoogle: async () => {
      const { ensureDemoRestaurantAccount, loadRestaurantWorkspace } =
        await workspaceApi();
      await hydrateRestaurantAccounts();
      const demo = await ensureDemoRestaurantAccount();
      await loadRestaurantWorkspace(
        get().user?.restaurantId ?? demo.id,
        { force: true },
      );

      const staff = useStaffStore.getState().listActive()[0];
      if (!staff) {
        return { ok: false, error: "Unable to sign in right now." };
      }

      const session = toStaffSession(staff);
      idbReady = true;
      persistSession(session);
      set({ user: session, hydrated: true });
      bindStaffLocation(staff);
      return { ok: true };
    },

    signUp: async (input) => {
      const { loadRestaurantWorkspace } = await workspaceApi();
      await hydrateRestaurantAccounts();
      const result = await createRestaurantAccount(input);
      if (!result.ok) return result;

      const account = result.account;
      await loadRestaurantWorkspace(account.id, { force: true });

      const adminRole = roleIdForRestaurant(account.id, "admin");
      useStaffStore.getState().createStaff({
        name: input.ownerName,
        mobile: input.contactNumber,
        email: input.email,
        role: adminRole,
        branchId: ALL_BRANCHES_ID,
        password: input.password,
      });

      const session = toOwnerSession(account);
      idbReady = true;
      persistSession(session);
      set({ user: session, hydrated: true });

      void import("@/store/settings-store").then(({ useSettingsStore }) => {
        const settings = useSettingsStore.getState();
        settings.save({
          restaurantName: input.restaurantName.trim(),
          restaurantPhone: input.contactNumber.trim(),
        });
        settings.bindToAccount(session.id, { branchId: ALL_BRANCHES_ID });
      });

      return { ok: true };
    },

    patchLocation: (activeBranchId, activeTillId) => {
      const user = get().user;
      if (!user) return;
      const session: AuthSession = {
        ...user,
        activeBranchId,
        activeTillId,
        // Assigned branch wins for staff; owner may only have active ids.
        branchId: user.branchId ?? activeBranchId,
      };
      persistSession(session);
      set({ user: session, hydrated: true });
    },

    refreshAssignedBranch: () => {
      const user = get().user;
      if (!user) return;
      const staff = useStaffStore.getState().findById(user.id);
      if (!staff) return;
      const session = toStaffSession(staff);
      session.activeTillId = user.activeTillId;
      persistSession(session);
      set({ user: session, hydrated: true });
      bindStaffLocation(staff);
    },

    signOut: () => {
      idbReady = true;
      writeSessionCache(null);
      queueDbWrite(() => clearAuthSession(), "clear auth session");
      void workspaceApi().then(({ clearRestaurantWorkspace }) =>
        clearRestaurantWorkspace(),
      );
      set({ user: null, hydrated: true });
    },
  }));
}

const AUTH_STORE_VERSION = 5;

const globalForAuth = globalThis as typeof globalThis & {
  __krunchAuthStore?: AuthStore;
  __krunchAuthStoreVersion?: number;
};

function getClientAuthStore(): AuthStore {
  const previous = globalForAuth.__krunchAuthStore?.getState().user ?? null;
  if (previous) writeSessionCache(previous);

  if (
    !globalForAuth.__krunchAuthStore ||
    globalForAuth.__krunchAuthStoreVersion !== AUTH_STORE_VERSION
  ) {
    globalForAuth.__krunchAuthStore = createAuthStore();
    globalForAuth.__krunchAuthStoreVersion = AUTH_STORE_VERSION;
  }

  return globalForAuth.__krunchAuthStore;
}

export const useAuthStore: AuthStore =
  typeof window !== "undefined" ? getClientAuthStore() : createAuthStore();

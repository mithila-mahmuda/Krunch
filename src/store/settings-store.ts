"use client";

import { create } from "zustand";
import {
  readAccountLocation,
  writeAccountLocation,
} from "@/lib/account-location";
import { loadTillSettings, saveTillSettings } from "@/lib/db/repos";
import { queueDbWrite } from "@/lib/db/write";
import {
  createDefaultBranch,
  nextBranchLabel,
  normalizeBranches,
  resolveActiveBranch,
  type Branch,
} from "@/lib/branches";
import { SERVICE_RATE, TAX_RATE } from "@/lib/mock-data";
import { findRestaurantByEmail } from "@/lib/restaurants";
import {
  createSeedLocations,
  ensureSeedLocations,
} from "@/lib/seed-locations";
import { DEMO_RESTAURANT_ID } from "@/lib/tenant";
import {
  createDefaultTills,
  ensureTillsForBranches,
  newTillId,
  nextTillLabel,
  normalizeTills,
  resolveActiveTill,
  tillsForBranch,
  type TillStation,
} from "@/lib/tills";
import { hasAllBranchAccess } from "@/lib/branch-access";
import { setActiveCurrencyCode } from "@/lib/active-currency";
import {
  applyBrandColor,
  DEFAULT_BRAND_COLOR,
  normalizeBrandColor,
} from "@/lib/brand-color";
import {
  DEFAULT_CURRENCY_CODE,
  normalizeCurrencyCode,
  type CurrencyCode,
} from "@/lib/currency";
import { assertCan } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export interface TillSettings {
  /** Active till display name — kept in sync for simple header reads. */
  tillName: string;
  branches: Branch[];
  activeBranchId: string;
  tills: TillStation[];
  activeTillId: string;
  taxRate: number;
  /** Inclusive = prices include VAT; exclusive = VAT added on top. */
  taxInclusive: boolean;
  serviceRate: number;
  serviceDefault: boolean;
  kitchenSound: boolean;
  /** When true, demo seed orders appear alongside live till data. */
  showDemoSeed: boolean;
  /** Brand / tenant name on receipts. */
  restaurantName: string;
  /** Mirrored from the active branch for legacy readers. */
  restaurantPhone: string;
  restaurantAddress: string;
  restaurantLogoDataUrl: string | null;
  /** Hex brand color for header / sidebar chrome (`#rrggbb`). */
  brandColor: string;
  /**
   * ISO 4217 code for display (e.g. GBP, BDT).
   * Money fields elsewhere stay numeric — never store symbols.
   */
  currencyCode: CurrencyCode;
}

interface SettingsState extends TillSettings {
  restaurantId: string | null;
  hydrated: boolean;
  hydrateForRestaurant: (restaurantId: string) => Promise<void>;
  /** @deprecated Prefer hydrateForRestaurant — loads active or demo workspace. */
  hydrate: () => Promise<void>;
  save: (patch: Partial<TillSettings>) => void;
  addBranch: (
    input?: Partial<Pick<Branch, "name" | "phone" | "address" | "logoDataUrl">>,
  ) => { ok: true; branch: Branch } | { ok: false; error: string };
  updateBranch: (
    id: string,
    patch: Partial<Pick<Branch, "name" | "phone" | "address" | "logoDataUrl">>,
  ) => { ok: true } | { ok: false; error: string };
  archiveBranch: (id: string) => { ok: true } | { ok: false; error: string };
  setActiveBranch: (id: string) => { ok: true } | { ok: false; error: string };
  addTill: (
    name?: string,
    branchId?: string,
  ) => { ok: true; till: TillStation } | { ok: false; error: string };
  renameTill: (
    id: string,
    name: string,
  ) => { ok: true } | { ok: false; error: string };
  archiveTill: (id: string) => { ok: true } | { ok: false; error: string };
  setActiveTill: (id: string) => { ok: true } | { ok: false; error: string };
  /**
   * Load this account's till prefs. Branch is forced when `branchId` is set
   * (admin-assigned) — staff cannot self-select a different branch.
   */
  bindToAccount: (
    accountId: string,
    options?: { branchId?: string },
  ) => void;
  getActiveBranch: () => Branch;
  getActiveTill: () => TillStation;
  getBranchTills: (branchId?: string) => TillStation[];
  resetDefaults: () => void;
}

const seedLocations = createSeedLocations();

const defaults: TillSettings = {
  tillName:
    seedLocations.tills.find((till) => till.id === seedLocations.activeTillId)
      ?.name ?? "Floor",
  branches: seedLocations.branches,
  activeBranchId: seedLocations.activeBranchId,
  tills: seedLocations.tills,
  activeTillId: seedLocations.activeTillId,
  taxRate: TAX_RATE,
  taxInclusive: true,
  serviceRate: SERVICE_RATE,
  serviceDefault: false,
  kitchenSound: true,
  showDemoSeed: true,
  restaurantName: "",
  restaurantPhone: "",
  restaurantAddress: "",
  restaurantLogoDataUrl: null,
  brandColor: DEFAULT_BRAND_COLOR,
  currencyCode: DEFAULT_CURRENCY_CODE,
};

function withAccountDefaults(settings: TillSettings): TillSettings {
  const user = useAuthStore.getState().user;
  const account = user?.email ? findRestaurantByEmail(user.email) : null;
  return {
    ...settings,
    restaurantName:
      settings.restaurantName.trim() ||
      user?.restaurantName?.trim() ||
      account?.restaurantName?.trim() ||
      "",
  };
}

/** Cloneable settings only — never spread full Zustand state into IDB. */
function settingsSnapshot(state: TillSettings): TillSettings {
  return {
    tillName: state.tillName,
    branches: state.branches,
    activeBranchId: state.activeBranchId,
    tills: state.tills,
    activeTillId: state.activeTillId,
    taxRate: state.taxRate,
    taxInclusive: state.taxInclusive,
    serviceRate: state.serviceRate,
    serviceDefault: state.serviceDefault,
    kitchenSound: state.kitchenSound,
    showDemoSeed: state.showDemoSeed,
    restaurantName: state.restaurantName,
    restaurantPhone: state.restaurantPhone,
    restaurantAddress: state.restaurantAddress,
    restaurantLogoDataUrl: state.restaurantLogoDataUrl,
    brandColor: state.brandColor,
    currencyCode: state.currencyCode,
  };
}

function withSyncedHierarchy(settings: TillSettings): TillSettings {
  const { branches, activeBranchId } = normalizeBranches(
    settings.branches,
    settings.activeBranchId,
    {
      name: settings.restaurantName,
      phone: settings.restaurantPhone,
      address: settings.restaurantAddress,
      logoDataUrl: settings.restaurantLogoDataUrl,
    },
  );
  const branch = resolveActiveBranch(branches, activeBranchId);
  const normalized = normalizeTills(
    settings.tills,
    settings.activeTillId,
    branch.id,
    settings.tillName,
  );
  const activeTillId = normalized.activeTillId;
  const tills = ensureTillsForBranches(branches, normalized.tills);
  const till = resolveActiveTill(tills, activeTillId, branch.id);

  return {
    ...settings,
    branches,
    activeBranchId: branch.id,
    tills,
    activeTillId: till.id,
    tillName: till.name,
    // Phone/address on screen follow the active branch; logo is brand-level only.
    restaurantPhone: branch.phone,
    restaurantAddress: branch.address,
    restaurantLogoDataUrl: settings.restaurantLogoDataUrl,
  };
}

function freshRestaurantDefaults(restaurantName = ""): TillSettings {
  const branch = createDefaultBranch({ name: "Main" });
  const seeded = createDefaultTills(branch.id, "Floor");
  return {
    tillName: seeded.tills[0]?.name ?? "Floor",
    branches: [branch],
    activeBranchId: branch.id,
    tills: seeded.tills,
    activeTillId: seeded.activeTillId,
    taxRate: TAX_RATE,
    taxInclusive: true,
    serviceRate: SERVICE_RATE,
    serviceDefault: false,
    kitchenSound: true,
    showDemoSeed: false,
    restaurantName,
    restaurantPhone: "",
    restaurantAddress: "",
    restaurantLogoDataUrl: null,
    brandColor: DEFAULT_BRAND_COLOR,
    currencyCode: DEFAULT_CURRENCY_CODE,
  };
}

function persist(settings: TillSettings) {
  const restaurantId = useSettingsStore.getState().restaurantId;
  if (!restaurantId) return;
  queueDbWrite(
    () => saveTillSettings(restaurantId, settingsSnapshot(settings)),
    "save settings",
  );
}

/** Keep active branch/till on the signed-in account, not on the device. */
function syncAccountSelection(settings: TillSettings) {
  const user = useAuthStore.getState().user;
  if (!user) return;
  writeAccountLocation(user.id, {
    activeBranchId: settings.activeBranchId,
    activeTillId: settings.activeTillId,
  });
  useAuthStore
    .getState()
    .patchLocation(settings.activeBranchId, settings.activeTillId);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,
  restaurantId: null,
  hydrated: false,

  hydrateForRestaurant: async (restaurantId) => {
    if (get().hydrated && get().restaurantId === restaurantId) return;

    const loaded = await loadTillSettings(restaurantId);
    const isDemo = restaurantId === DEMO_RESTAURANT_ID;

    const upgradeKey = "krunch-demo-seed-v2";
    const needsDemoUpgrade =
      isDemo &&
      typeof window !== "undefined" &&
      window.localStorage.getItem(upgradeKey) !== "1";

    const emptyDefaults = isDemo
      ? defaults
      : freshRestaurantDefaults(
          useAuthStore.getState().user?.restaurantName?.trim() || "",
        );

    const baseBranches = loaded?.branches ?? emptyDefaults.branches;
    const baseTills = loaded?.tills ?? emptyDefaults.tills;
    const seeded = isDemo
      ? ensureSeedLocations(baseBranches, baseTills)
      : { branches: baseBranches, tills: baseTills, changed: false };

    const merged = withSyncedHierarchy(
      withAccountDefaults({
        ...(loaded ?? emptyDefaults),
        branches: seeded.branches,
        activeBranchId:
          loaded?.activeBranchId ?? emptyDefaults.activeBranchId,
        tills: seeded.tills,
        activeTillId: loaded?.activeTillId ?? emptyDefaults.activeTillId,
        taxInclusive: loaded?.taxInclusive ?? emptyDefaults.taxInclusive,
        showDemoSeed: needsDemoUpgrade
          ? true
          : (loaded?.showDemoSeed ?? emptyDefaults.showDemoSeed),
        restaurantName:
          loaded?.restaurantName ?? emptyDefaults.restaurantName,
        restaurantPhone:
          loaded?.restaurantPhone ?? emptyDefaults.restaurantPhone,
        restaurantAddress:
          loaded?.restaurantAddress ?? emptyDefaults.restaurantAddress,
        restaurantLogoDataUrl:
          loaded?.restaurantLogoDataUrl ??
          emptyDefaults.restaurantLogoDataUrl,
        brandColor: normalizeBrandColor(
          loaded?.brandColor ?? emptyDefaults.brandColor,
        ),
        currencyCode: normalizeCurrencyCode(
          loaded?.currencyCode ?? emptyDefaults.currencyCode,
        ),
      }),
    );

    if (needsDemoUpgrade) {
      window.localStorage.setItem(upgradeKey, "1");
    }

    const shouldPersist =
      !loaded ||
      needsDemoUpgrade ||
      seeded.changed ||
      !loaded.branches?.length ||
      !loaded.tills?.length ||
      (!loaded?.restaurantName && Boolean(merged.restaurantName));

    set({ ...merged, restaurantId, hydrated: true });
    applyBrandColor(merged.brandColor);
    setActiveCurrencyCode(merged.currencyCode);
    if (shouldPersist) {
      persist(merged);
    }
  },

  hydrate: async () => {
    await get().hydrateForRestaurant(get().restaurantId ?? DEMO_RESTAURANT_ID);
  },

  save: (patch) => {
    const denied = assertCan(
      useAuthStore.getState().user?.role,
      "edit_settings",
    );
    if (!denied.ok) return;

    const current = get();
    let branches = patch.branches ?? current.branches;
    const activeBranchId = patch.activeBranchId ?? current.activeBranchId;

    // Phone/address still mirror onto the active branch for receipts.
    // Logo stays on the restaurant brand only — never per-branch.
    if (
      patch.restaurantPhone !== undefined ||
      patch.restaurantAddress !== undefined
    ) {
      branches = branches.map((branch) =>
        branch.id === activeBranchId
          ? {
              ...branch,
              phone:
                patch.restaurantPhone !== undefined
                  ? patch.restaurantPhone
                  : branch.phone,
              address:
                patch.restaurantAddress !== undefined
                  ? patch.restaurantAddress
                  : branch.address,
            }
          : branch,
      );
    }

    const next = withSyncedHierarchy({
      tillName: patch.tillName ?? current.tillName,
      branches,
      activeBranchId,
      tills: patch.tills ?? current.tills,
      activeTillId: patch.activeTillId ?? current.activeTillId,
      taxRate: patch.taxRate ?? current.taxRate,
      taxInclusive: patch.taxInclusive ?? current.taxInclusive,
      serviceRate: patch.serviceRate ?? current.serviceRate,
      serviceDefault: patch.serviceDefault ?? current.serviceDefault,
      kitchenSound: patch.kitchenSound ?? current.kitchenSound,
      showDemoSeed: patch.showDemoSeed ?? current.showDemoSeed,
      restaurantName: patch.restaurantName ?? current.restaurantName,
      restaurantPhone: patch.restaurantPhone ?? current.restaurantPhone,
      restaurantAddress: patch.restaurantAddress ?? current.restaurantAddress,
      restaurantLogoDataUrl:
        patch.restaurantLogoDataUrl !== undefined
          ? patch.restaurantLogoDataUrl
          : current.restaurantLogoDataUrl,
      brandColor: normalizeBrandColor(
        patch.brandColor !== undefined ? patch.brandColor : current.brandColor,
      ),
      currencyCode: normalizeCurrencyCode(
        patch.currencyCode !== undefined
          ? patch.currencyCode
          : current.currencyCode,
      ),
    });
    set({ ...next, hydrated: true });
    applyBrandColor(next.brandColor);
    setActiveCurrencyCode(next.currencyCode);
    persist(next);
  },

  addBranch: (input) => {
    const denied = assertCan(
      useAuthStore.getState().user?.role,
      "edit_settings",
    );
    if (!denied.ok) return denied;

    const name = (
      input?.name?.trim() || nextBranchLabel(get().branches)
    ).slice(0, 60);
    if (!name) return { ok: false, error: "Enter a branch name." };

    const branch = createDefaultBranch({
      name,
      phone: input?.phone,
      address: input?.address,
      logoDataUrl: input?.logoDataUrl,
    });
    const tills = [
      ...get().tills,
      ...createDefaultTills(branch.id).tills,
    ];
    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      branches: [...get().branches, branch],
      tills,
    });
    set({ ...next, hydrated: true });
    persist(next);
    void import("@/store/ops-store").then(({ useOpsStore }) => {
      useOpsStore.getState().ensureBranchAssets([branch.id]);
    });
    return { ok: true, branch };
  },

  updateBranch: (id, patch) => {
    const denied = assertCan(
      useAuthStore.getState().user?.role,
      "edit_settings",
    );
    if (!denied.ok) return denied;

    if (!get().branches.some((branch) => branch.id === id)) {
      return { ok: false, error: "Branch not found." };
    }
    const name = patch.name?.trim();
    if (patch.name !== undefined && !name) {
      return { ok: false, error: "Enter a branch name." };
    }

    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      branches: get().branches.map((branch) =>
        branch.id === id
          ? {
              ...branch,
              name: name ?? branch.name,
              phone:
                patch.phone !== undefined ? patch.phone.trim() : branch.phone,
              address:
                patch.address !== undefined
                  ? patch.address.trim()
                  : branch.address,
              logoDataUrl:
                patch.logoDataUrl !== undefined
                  ? patch.logoDataUrl
                  : branch.logoDataUrl,
            }
          : branch,
      ),
    });
    set({ ...next, hydrated: true });
    persist(next);
    return { ok: true };
  },

  archiveBranch: (id) => {
    const denied = assertCan(
      useAuthStore.getState().user?.role,
      "edit_settings",
    );
    if (!denied.ok) return denied;

    const active = get().branches.filter((branch) => !branch.archived);
    if (active.length <= 1 && active[0]?.id === id) {
      return { ok: false, error: "Keep at least one active branch." };
    }
    if (!get().branches.some((branch) => branch.id === id)) {
      return { ok: false, error: "Branch not found." };
    }

    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      branches: get().branches.map((branch) =>
        branch.id === id ? { ...branch, archived: true } : branch,
      ),
      tills: get().tills.map((till) =>
        till.branchId === id ? { ...till, archived: true } : till,
      ),
    });
    set({ ...next, hydrated: true });
    persist(next);
    return { ok: true };
  },

  setActiveBranch: (id) => {
    const branch = get().branches.find(
      (item) => item.id === id && !item.archived,
    );
    if (!branch) return { ok: false, error: "Branch not found." };

    const assignedBranchId = useAuthStore.getState().user?.branchId;
    if (
      assignedBranchId &&
      !hasAllBranchAccess(assignedBranchId) &&
      assignedBranchId !== id
    ) {
      return { ok: false, error: "Branch is assigned by an admin." };
    }

    const branchTill =
      tillsForBranch(get().tills, id)[0] ??
      resolveActiveTill(get().tills, get().activeTillId, id);

    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      activeBranchId: id,
      activeTillId: branchTill.id,
    });
    set({ ...next, hydrated: true });
    syncAccountSelection(next);
    return { ok: true };
  },

  addTill: (name, branchId) => {
    const denied = assertCan(
      useAuthStore.getState().user?.role,
      "edit_settings",
    );
    if (!denied.ok) return denied;

    const targetBranchId = branchId ?? get().activeBranchId;
    const branch = get().branches.find(
      (item) => item.id === targetBranchId && !item.archived,
    );
    if (!branch) return { ok: false, error: "Branch not found." };

    const label = (
      name?.trim() || nextTillLabel(get().tills, targetBranchId)
    ).slice(0, 40);
    if (!label) return { ok: false, error: "Enter a till name." };

    const till: TillStation = {
      id: newTillId(),
      branchId: targetBranchId,
      name: label,
      archived: false,
    };
    // Adding a till on another branch must not move this account's location.
    const stayOnAssigned = get().activeBranchId === targetBranchId;
    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      tills: [...get().tills, till],
      ...(stayOnAssigned ? { activeTillId: till.id } : {}),
    });
    set({ ...next, hydrated: true });
    persist(next);
    if (stayOnAssigned) syncAccountSelection(next);
    return { ok: true, till };
  },

  renameTill: (id, name) => {
    const denied = assertCan(
      useAuthStore.getState().user?.role,
      "edit_settings",
    );
    if (!denied.ok) return denied;

    const label = name.trim().slice(0, 40);
    if (!label) return { ok: false, error: "Enter a till name." };
    if (!get().tills.some((till) => till.id === id)) {
      return { ok: false, error: "Till not found." };
    }

    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      tills: get().tills.map((till) =>
        till.id === id ? { ...till, name: label } : till,
      ),
    });
    set({ ...next, hydrated: true });
    persist(next);
    return { ok: true };
  },

  archiveTill: (id) => {
    const denied = assertCan(
      useAuthStore.getState().user?.role,
      "edit_settings",
    );
    if (!denied.ok) return denied;

    const till = get().tills.find((item) => item.id === id);
    if (!till) return { ok: false, error: "Till not found." };

    const activeInBranch = tillsForBranch(get().tills, till.branchId);
    if (activeInBranch.length <= 1 && activeInBranch[0]?.id === id) {
      return { ok: false, error: "Keep at least one till on this branch." };
    }

    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      tills: get().tills.map((item) =>
        item.id === id ? { ...item, archived: true } : item,
      ),
    });
    set({ ...next, hydrated: true });
    persist(next);
    return { ok: true };
  },

  setActiveTill: (id) => {
    // Anyone on an allowed branch may switch tills — no role/permission check.
    const till = get().tills.find((item) => item.id === id && !item.archived);
    if (!till) return { ok: false, error: "Till not found." };

    const assignedBranchId = useAuthStore.getState().user?.branchId;
    if (
      assignedBranchId &&
      !hasAllBranchAccess(assignedBranchId) &&
      till.branchId !== assignedBranchId
    ) {
      return { ok: false, error: "Till is not on your assigned branch." };
    }

    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      activeBranchId: till.branchId,
      activeTillId: id,
    });
    set({ ...next, hydrated: true });
    syncAccountSelection(next);
    return { ok: true };
  },

  bindToAccount: (accountId, options) => {
    const prefs = readAccountLocation(accountId);
    const session = useAuthStore.getState().user;
    const assignedBranchId =
      options?.branchId ?? session?.branchId ?? undefined;
    const allBranches = hasAllBranchAccess(assignedBranchId);
    const next = withSyncedHierarchy({
      ...settingsSnapshot(get()),
      activeBranchId: allBranches
        ? (prefs?.activeBranchId ??
          session?.activeBranchId ??
          get().activeBranchId)
        : (assignedBranchId ??
          prefs?.activeBranchId ??
          session?.activeBranchId ??
          get().activeBranchId),
      activeTillId:
        prefs?.activeTillId ?? session?.activeTillId ?? get().activeTillId,
    });
    set({ ...next, hydrated: true });
    writeAccountLocation(accountId, {
      activeBranchId: next.activeBranchId,
      activeTillId: next.activeTillId,
    });
    useAuthStore
      .getState()
      .patchLocation(next.activeBranchId, next.activeTillId);
  },

  getActiveBranch: () =>
    resolveActiveBranch(get().branches, get().activeBranchId),

  getActiveTill: () =>
    resolveActiveTill(get().tills, get().activeTillId, get().activeBranchId),

  getBranchTills: (branchId) =>
    tillsForBranch(get().tills, branchId ?? get().activeBranchId),

  resetDefaults: () => {
    const next = withSyncedHierarchy(withAccountDefaults({ ...defaults }));
    set({ ...next, hydrated: true });
    applyBrandColor(next.brandColor);
    setActiveCurrencyCode(next.currencyCode);
    persist(next);
  },
}));

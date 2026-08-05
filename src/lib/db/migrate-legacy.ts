"use client";

import {
  getMigrationFlag,
  saveAuthSession,
  saveCatalog,
  saveCustomers,
  saveOpsSnapshot,
  saveRestaurantAccounts,
  saveTillSettings,
  setMigrationFlag,
  type AuthSessionRow,
  type OpsSnapshot,
  type RestaurantAccountRow,
  type TillSettingsRow,
} from "@/lib/db/repos";
import type { CustomerRecord, FloorTable, InventoryItem } from "@/lib/module-data";
import { createDefaultBranch } from "@/lib/branches";
import { createDefaultTills } from "@/lib/tills";
import { DEFAULT_BRAND_COLOR } from "@/lib/brand-color";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import { DEMO_RESTAURANT_ID } from "@/lib/tenant";
import type { OpsOrder, Product } from "@/lib/types";

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** One-time import from old localStorage JSON into IndexedDB tables. */
export async function migrateLegacyLocalStorage(): Promise<void> {
  if (await getMigrationFlag()) return;

  const ops = readJson<{
    orders?: OpsOrder[];
    tables?: FloorTable[];
    inventory?: InventoryItem[];
    nextOrderNumber?: number;
    floatAmount?: number;
  }>("krunch-ops");

  if (ops) {
    const snapshot: OpsSnapshot = {
      orders: ops.orders ?? [],
      tables: ops.tables ?? [],
      inventory: ops.inventory ?? [],
      nextOrderNumber: ops.nextOrderNumber ?? 1100,
      floatAmount: ops.floatAmount ?? 150,
      cashEvents: [],
    };
    await saveOpsSnapshot(DEMO_RESTAURANT_ID, snapshot);
  }

  const customers = readJson<CustomerRecord[]>("krunch-customers");
  if (customers?.length) {
    await saveCustomers(DEMO_RESTAURANT_ID, customers);
  }

  const catalog = readJson<Product[]>("krunch-catalog");
  if (catalog?.length) {
    await saveCatalog(DEMO_RESTAURANT_ID, catalog);
  }

  const settings = readJson<Partial<TillSettingsRow>>("krunch-settings");
  if (settings && Object.keys(settings).length > 0) {
    const branch =
      settings.branches?.[0] ??
      createDefaultBranch({
        name: settings.restaurantName?.trim() || "Main",
        phone: settings.restaurantPhone,
        address: settings.restaurantAddress,
        logoDataUrl: settings.restaurantLogoDataUrl,
      });
    const seeded = createDefaultTills(branch.id, settings.tillName ?? "TILL 1");
    const tills = settings.tills?.length
      ? settings.tills.map((till) => ({
          ...till,
          branchId: till.branchId || branch.id,
        }))
      : seeded.tills;
    await saveTillSettings(DEMO_RESTAURANT_ID, {
      restaurantId: DEMO_RESTAURANT_ID,
      tillName: seeded.tills[0]!.name,
      branches: settings.branches?.length ? settings.branches : [branch],
      activeBranchId: settings.activeBranchId ?? branch.id,
      tills,
      activeTillId: settings.activeTillId ?? seeded.activeTillId,
      taxRate: settings.taxRate ?? 0.2,
      taxInclusive: settings.taxInclusive ?? true,
      serviceRate: settings.serviceRate ?? 0.125,
      serviceDefault: settings.serviceDefault ?? false,
      kitchenSound: settings.kitchenSound ?? true,
      showDemoSeed: settings.showDemoSeed ?? true,
      restaurantName: settings.restaurantName ?? "",
      restaurantPhone: settings.restaurantPhone ?? "",
      restaurantAddress: settings.restaurantAddress ?? "",
      restaurantLogoDataUrl: settings.restaurantLogoDataUrl ?? null,
      brandColor: settings.brandColor ?? DEFAULT_BRAND_COLOR,
      currencyCode: settings.currencyCode ?? DEFAULT_CURRENCY_CODE,
    });
  }

  const session = readJson<AuthSessionRow>("krunch-auth");
  if (session?.id && session.name && session.email) {
    await saveAuthSession({
      ...session,
      restaurantId: session.restaurantId ?? DEMO_RESTAURANT_ID,
    });
  }

  const restaurants = readJson<RestaurantAccountRow[]>("krunch-restaurants");
  if (restaurants?.length) {
    await saveRestaurantAccounts(restaurants);
  }

  await setMigrationFlag();

  for (const key of [
    "krunch-ops",
    "krunch-customers",
    "krunch-catalog",
    "krunch-settings",
    "krunch-auth",
    "krunch-restaurants",
  ]) {
    window.localStorage.removeItem(key);
  }
}

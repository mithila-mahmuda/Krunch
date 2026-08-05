"use client";

import { create } from "zustand";
import { loadCatalog, saveCatalog } from "@/lib/db/repos";
import { queueDbWrite } from "@/lib/db/write";
import { products as seedProducts } from "@/lib/mock-data";
import { assertCan } from "@/lib/permissions";
import { DEMO_RESTAURANT_ID, tenantEntityId } from "@/lib/tenant";
import type { Product } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

interface CatalogState {
  restaurantId: string | null;
  products: Product[];
  hydrated: boolean;
  hydrateForRestaurant: (restaurantId: string) => Promise<void>;
  hydrate: () => Promise<void>;
  setAvailability: (productId: string, available: boolean) => void;
  toggleAvailability: (productId: string) => void;
  updatePrice: (productId: string, price: number) => void;
  getProduct: (productId: string) => Product | undefined;
  persist: () => void;
}

function withDefaults(list: Product[], restaurantId: string): Product[] {
  const byId = new Map(list.map((product) => [product.id, product]));
  return seedProducts.map((seed) => {
    const id = tenantEntityId(restaurantId, seed.id);
    const existing = byId.get(id) ?? byId.get(seed.id);
    return {
      ...seed,
      id,
      restaurantId,
      available: existing?.available ?? seed.available ?? true,
      price: existing?.price ?? seed.price,
    };
  });
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  restaurantId: null,
  products: seedProducts.map((product) => ({
    ...product,
    available: product.available ?? true,
  })),
  hydrated: false,

  hydrateForRestaurant: async (restaurantId) => {
    if (get().hydrated && get().restaurantId === restaurantId) return;
    const stored = await loadCatalog(restaurantId);
    set({
      restaurantId,
      products: withDefaults(stored, restaurantId),
      hydrated: true,
    });
    if (stored.length === 0) {
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
      () => saveCatalog(restaurantId, get().products),
      "save catalog",
    );
  },

  setAvailability: (productId, available) => {
    const denied = assertCan(useAuthStore.getState().user?.role, "edit_menu");
    if (!denied.ok) return;

    set((state) => {
      const products = state.products.map((product) =>
        product.id === productId ? { ...product, available } : product,
      );
      return { products };
    });
    get().persist();
  },

  toggleAvailability: (productId) => {
    const denied = assertCan(useAuthStore.getState().user?.role, "edit_menu");
    if (!denied.ok) return;

    const product = get().products.find((item) => item.id === productId);
    if (!product) return;
    get().setAvailability(productId, product.available === false);
  },

  updatePrice: (productId, price) => {
    const denied = assertCan(useAuthStore.getState().user?.role, "edit_menu");
    if (!denied.ok) return;
    if (!(price > 0)) return;

    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId ? { ...product, price } : product,
      ),
    }));
    get().persist();
  },

  getProduct: (productId) =>
    get().products.find((product) => product.id === productId),
}));

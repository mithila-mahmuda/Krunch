"use client";

import { create } from "zustand";
import { promotions } from "@/lib/mock-data";
import type {
  DiningOption,
  OrderLine,
  Product,
  SidebarTab,
} from "@/lib/types";

interface PosState {
  activeCategoryId: string | null;
  lines: OrderLine[];
  selectedLineId: string | null;
  diningOption: DiningOption;
  serviceEnabled: boolean;
  activeTab: SidebarTab;
  navOpen: boolean;
  orderPanelOpen: boolean;
  setActiveCategory: (categoryId: string | null) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setNavOpen: (open: boolean) => void;
  setOrderPanelOpen: (open: boolean) => void;
  addProduct: (product: Product) => void;
  selectLine: (lineId: string | null) => void;
  updateQuantity: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  clearOrder: () => void;
  setDiningOption: (option: DiningOption) => void;
  toggleService: () => void;
  setLineNote: (lineId: string, note: string) => void;
  applyLineDiscount: (lineId: string, amount: number) => void;
}

function createLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyPromotions(lines: OrderLine[]): OrderLine[] {
  const next = lines.map((line) => ({
    ...line,
    discountAmount: 0,
    promotionLabel: undefined as string | undefined,
  }));

  for (const promo of promotions) {
    const eligible = next.filter((line) =>
      promo.productIds.includes(line.productId),
    );
    const eligibleQty = eligible.reduce((sum, line) => sum + line.quantity, 0);

    if (eligibleQty < promo.requiredQuantity) continue;

    let unitsToDiscount =
      Math.floor(eligibleQty / promo.requiredQuantity) * promo.requiredQuantity;

    for (const line of eligible) {
      if (unitsToDiscount <= 0) break;

      const discountableUnits = Math.min(line.quantity, unitsToDiscount);
      const fullPrice = line.unitPrice * discountableUnits;
      const promoPrice = promo.discountedUnitPrice * discountableUnits;
      const discount = Math.max(0, fullPrice - promoPrice);

      line.discountAmount += discount;
      line.promotionLabel = promo.label;
      unitsToDiscount -= discountableUnits;
    }
  }

  return next;
}

export const usePosStore = create<PosState>((set) => ({
  activeCategoryId: null,
  lines: [],
  selectedLineId: null,
  diningOption: "eat_in",
  serviceEnabled: false,
  activeTab: "menu",
  navOpen: false,
  orderPanelOpen: false,

  setActiveCategory: (categoryId) => set({ activeCategoryId: categoryId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setNavOpen: (open) => set({ navOpen: open }),
  setOrderPanelOpen: (open) => set({ orderPanelOpen: open }),

  addProduct: (product) => {
    set((state) => {
      const existing = state.lines.find(
        (line) => line.productId === product.id && !line.note,
      );

      let lines: OrderLine[];

      if (existing) {
        lines = state.lines.map((line) =>
          line.id === existing.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      } else {
        const newLine: OrderLine = {
          id: createLineId(),
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          discountAmount: 0,
        };
        lines = [...state.lines, newLine];
      }

      const withPromos = applyPromotions(lines);
      const selected =
        withPromos.find((line) => line.productId === product.id)?.id ??
        state.selectedLineId;

      return {
        lines: withPromos,
        selectedLineId: selected,
        activeCategoryId: state.activeCategoryId ?? product.categoryId,
      };
    });
  },

  selectLine: (lineId) => set({ selectedLineId: lineId }),

  updateQuantity: (lineId, delta) => {
    set((state) => {
      const lines = state.lines
        .map((line) =>
          line.id === lineId
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0);

      return {
        lines: applyPromotions(lines),
        selectedLineId: lines.some((line) => line.id === lineId)
          ? lineId
          : lines.at(-1)?.id ?? null,
      };
    });
  },

  removeLine: (lineId) => {
    set((state) => {
      const lines = applyPromotions(
        state.lines.filter((line) => line.id !== lineId),
      );
      return {
        lines,
        selectedLineId:
          state.selectedLineId === lineId
            ? lines.at(-1)?.id ?? null
            : state.selectedLineId,
      };
    });
  },

  clearOrder: () =>
    set({
      lines: [],
      selectedLineId: null,
    }),

  setDiningOption: (option) => set({ diningOption: option }),

  toggleService: () =>
    set((state) => ({ serviceEnabled: !state.serviceEnabled })),

  setLineNote: (lineId, note) => {
    set((state) => ({
      lines: state.lines.map((line) =>
        line.id === lineId ? { ...line, note: note.trim() || undefined } : line,
      ),
    }));
  },

  applyLineDiscount: (lineId, amount) => {
    set((state) => {
      const lines = state.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              discountAmount: Math.min(
                Math.max(0, amount),
                line.unitPrice * line.quantity,
              ),
            }
          : line,
      );
      return { lines: applyPromotions(lines) };
    });
  },
}));

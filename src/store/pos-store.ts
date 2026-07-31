"use client";

import { create } from "zustand";
import { promotions } from "@/lib/mock-data";
import { computeTotals } from "@/lib/order-math";
import { useAuthStore } from "@/store/auth-store";
import type {
  CompletedOrder,
  DiningOption,
  HeldOrder,
  OrderLine,
  Product,
  SidebarTab,
  TenderResult,
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
  searchOpen: boolean;
  customerId: string | null;
  customerName: string | null;
  tableId: string | null;
  tableLabel: string | null;
  heldOrders: HeldOrder[];
  completedOrders: CompletedOrder[];
  floatAmount: number;
  statusMessage: string | null;
  lastReceipt: string | null;
  setActiveCategory: (categoryId: string | null) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setNavOpen: (open: boolean) => void;
  setOrderPanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  addProduct: (product: Product) => void;
  addMiscProduct: (name: string, price: number) => void;
  selectLine: (lineId: string | null) => void;
  updateQuantity: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  clearOrder: () => void;
  setDiningOption: (option: DiningOption) => void;
  toggleService: () => void;
  setLineNote: (lineId: string, note: string) => void;
  applyLineDiscount: (
    lineId: string,
    amount: number,
    meta?: { mode: "amount" | "percent"; percent?: number },
  ) => void;
  attachCustomer: (customer: { id: string; name: string } | null) => void;
  attachTable: (table: { id: string; label: string } | null) => void;
  holdOrder: () => { ok: true; order: HeldOrder } | { ok: false; error: string };
  recallOrder: (orderId: string) => { ok: true } | { ok: false; error: string };
  completePayment: (
    tender: TenderResult,
  ) => { ok: true; receipt: string } | { ok: false; error: string };
  openCashDrawer: (reason: string) => void;
  recordPettyCash: (
    amount: number,
    reason: string,
  ) => { ok: true } | { ok: false; error: string };
  adjustFloat: (
    amount: number,
  ) => { ok: true } | { ok: false; error: string };
  printReceipt: () => { ok: true; receipt: string } | { ok: false; error: string };
  setStatusMessage: (message: string | null) => void;
}

function createLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createOrderNumber(): string {
  return `#${1000 + Math.floor(Math.random() * 9000)}`;
}

function applyPromotions(lines: OrderLine[]): OrderLine[] {
  const next = lines.map((line) => ({
    ...line,
    discountAmount: line.manualDiscountAmount,
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

      line.discountAmount = line.manualDiscountAmount + discount;
      line.promotionLabel = promo.label;
      unitsToDiscount -= discountableUnits;
    }
  }

  return next;
}

function emptyTicket() {
  return {
    lines: [] as OrderLine[],
    selectedLineId: null as string | null,
    customerId: null as string | null,
    customerName: null as string | null,
    tableId: null as string | null,
    tableLabel: null as string | null,
    serviceEnabled: false,
    diningOption: "eat_in" as DiningOption,
  };
}

function buildReceipt(state: {
  lines: OrderLine[];
  serviceEnabled: boolean;
  diningOption: DiningOption;
  customerName: string | null;
  tableLabel: string | null;
  tender?: TenderResult;
}): string {
  const totals = computeTotals(state.lines, state.serviceEnabled);
  const itemLines = state.lines
    .map((line) => {
      const total = line.unitPrice * line.quantity - line.discountAmount;
      const note = line.note ? `\n   note: ${line.note}` : "";
      return `${line.quantity}x ${line.name}  £${total.toFixed(2)}${note}`;
    })
    .join("\n");

  return [
    "KRUNCH RECEIPT",
    `Dining: ${state.diningOption.replace("_", " ")}`,
    state.tableLabel ? `Table: ${state.tableLabel}` : null,
    state.customerName ? `Guest: ${state.customerName}` : null,
    "----------------",
    itemLines || "(no items)",
    "----------------",
    `Subtotal  £${totals.subtotal.toFixed(2)}`,
    totals.totalDiscount > 0
      ? `Discount  -£${totals.totalDiscount.toFixed(2)}`
      : null,
    state.serviceEnabled
      ? `Service   £${totals.serviceCharge.toFixed(2)}`
      : null,
    `Tax       £${totals.tax.toFixed(2)}`,
    `TOTAL     £${totals.total.toFixed(2)}`,
    state.tender
      ? `${state.tender.method.toUpperCase()} £${state.tender.amountTendered.toFixed(2)}`
      : null,
    state.tender && state.tender.change > 0
      ? `Change    £${state.tender.change.toFixed(2)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export const usePosStore = create<PosState>((set, get) => ({
  activeCategoryId: null,
  lines: [],
  selectedLineId: null,
  diningOption: "eat_in",
  serviceEnabled: false,
  activeTab: "menu",
  navOpen: false,
  orderPanelOpen: false,
  searchOpen: false,
  customerId: null,
  customerName: null,
  tableId: null,
  tableLabel: null,
  heldOrders: [],
  completedOrders: [],
  floatAmount: 150,
  statusMessage: null,
  lastReceipt: null,

  setActiveCategory: (categoryId) => set({ activeCategoryId: categoryId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setNavOpen: (open) => set({ navOpen: open }),
  setOrderPanelOpen: (open) => set({ orderPanelOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setStatusMessage: (message) => set({ statusMessage: message }),

  addProduct: (product) => {
    set((state) => {
      const existing = state.lines.find(
        (line) =>
          line.productId === product.id &&
          !line.note &&
          line.manualDiscountAmount === 0,
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
          manualDiscountAmount: 0,
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
        orderPanelOpen: state.orderPanelOpen,
      };
    });
  },

  addMiscProduct: (name, price) => {
    const trimmed = name.trim();
    if (!trimmed || !(price > 0)) return;

    set((state) => {
      const newLine: OrderLine = {
        id: createLineId(),
        productId: `misc-${Date.now().toString(36)}`,
        name: trimmed,
        unitPrice: Math.round(price * 100) / 100,
        quantity: 1,
        manualDiscountAmount: 0,
        discountAmount: 0,
      };
      const lines = applyPromotions([...state.lines, newLine]);
      return {
        lines,
        selectedLineId: newLine.id,
        activeTab: "menu",
        statusMessage: `Added ${trimmed}`,
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
        .filter((line) => line.quantity > 0)
        .map((line) => ({
          ...line,
          manualDiscountAmount: Math.min(
            line.manualDiscountAmount,
            line.unitPrice * line.quantity,
          ),
        }));

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

  clearOrder: () => set({ ...emptyTicket(), statusMessage: "Order cleared" }),

  setDiningOption: (option) =>
    set({
      diningOption: option,
      statusMessage: `Dining set to ${option.replace("_", " ")}`,
    }),

  toggleService: () =>
    set((state) => ({ serviceEnabled: !state.serviceEnabled })),

  setLineNote: (lineId, note) => {
    set((state) => ({
      lines: state.lines.map((line) =>
        line.id === lineId ? { ...line, note: note.trim() || undefined } : line,
      ),
      statusMessage: note.trim() ? "Note saved" : "Note cleared",
    }));
  },

  applyLineDiscount: (lineId, amount, meta) => {
    set((state) => {
      const lines = state.lines.map((line) => {
        if (line.id !== lineId) return line;
        const capped = Math.min(
          Math.max(0, amount),
          line.unitPrice * line.quantity,
        );
        return {
          ...line,
          manualDiscountAmount: Math.round(capped * 100) / 100,
        };
      });

      let statusMessage = "Discount cleared";
      if (amount > 0) {
        statusMessage =
          meta?.mode === "percent" && meta.percent != null
            ? `Discount ${meta.percent}% (£${amount.toFixed(2)}) applied`
            : `Discount £${amount.toFixed(2)} applied`;
      }

      return {
        lines: applyPromotions(lines),
        statusMessage,
      };
    });
  },

  attachCustomer: (customer) =>
    set({
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
      statusMessage: customer
        ? `${customer.name} attached`
        : "Customer removed",
    }),

  attachTable: (table) =>
    set({
      tableId: table?.id ?? null,
      tableLabel: table?.label ?? null,
      statusMessage: table ? `Table ${table.label} assigned` : "Table cleared",
    }),

  holdOrder: () => {
    const state = get();
    if (state.lines.length === 0) {
      return { ok: false, error: "Add items before holding an order." };
    }

    const totals = computeTotals(state.lines, state.serviceEnabled);
    const order: HeldOrder = {
      id: `hold-${Date.now().toString(36)}`,
      number: createOrderNumber(),
      lines: state.lines.map((line) => ({ ...line })),
      diningOption: state.diningOption,
      serviceEnabled: state.serviceEnabled,
      customerId: state.customerId,
      customerName: state.customerName,
      tableId: state.tableId,
      tableLabel: state.tableLabel,
      heldAt: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      total: totals.total,
    };

    set({
      heldOrders: [order, ...state.heldOrders],
      ...emptyTicket(),
      activeTab: "orders",
      statusMessage: `Order ${order.number} held`,
    });

    return { ok: true, order };
  },

  recallOrder: (orderId) => {
    const state = get();
    const order = state.heldOrders.find((item) => item.id === orderId);
    if (!order) return { ok: false, error: "Held order not found." };

    if (state.lines.length > 0) {
      return {
        ok: false,
        error: "Clear or hold the current ticket before recalling.",
      };
    }

    set({
      lines: order.lines.map((line) => ({ ...line })),
      selectedLineId: order.lines.at(-1)?.id ?? null,
      diningOption: order.diningOption,
      serviceEnabled: order.serviceEnabled,
      customerId: order.customerId,
      customerName: order.customerName,
      tableId: order.tableId,
      tableLabel: order.tableLabel,
      heldOrders: state.heldOrders.filter((item) => item.id !== orderId),
      activeTab: "menu",
      statusMessage: `Recalled ${order.number}`,
    });

    return { ok: true };
  },

  completePayment: (tender) => {
    const state = get();
    if (state.lines.length === 0) {
      return { ok: false, error: "Nothing to pay." };
    }

    const totals = computeTotals(state.lines, state.serviceEnabled);
    if (tender.amountTendered + 0.001 < totals.due) {
      return { ok: false, error: "Amount tendered is less than due." };
    }

    const change =
      tender.method === "cash"
        ? Math.round((tender.amountTendered - totals.due) * 100) / 100
        : 0;

    const receipt = buildReceipt({
      ...state,
      tender: { ...tender, change },
    });

    const completed: CompletedOrder = {
      id: `paid-${Date.now().toString(36)}`,
      number: createOrderNumber(),
      lines: state.lines.map((line) => ({ ...line })),
      diningOption: state.diningOption,
      serviceEnabled: state.serviceEnabled,
      customerId: state.customerId,
      customerName: state.customerName,
      tableId: state.tableId,
      tableLabel: state.tableLabel,
      paidAt: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      total: totals.total,
      method: tender.method,
      receipt,
      server: useAuthStore.getState().user?.name ?? "Staff",
    };

    set({
      ...emptyTicket(),
      completedOrders: [completed, ...state.completedOrders],
      floatAmount:
        tender.method === "cash"
          ? state.floatAmount + totals.due
          : state.floatAmount,
      lastReceipt: receipt,
      statusMessage: `Paid £${totals.due.toFixed(2)}${
        change > 0 ? ` · Change £${change.toFixed(2)}` : ""
      }`,
    });

    return { ok: true, receipt };
  },

  openCashDrawer: (reason) => {
    set({ statusMessage: `Cash drawer opened (${reason})` });
  },

  recordPettyCash: (amount, reason) => {
    if (!(amount > 0)) return { ok: false, error: "Enter a valid amount." };
    if (!reason.trim()) return { ok: false, error: "Enter a reason." };

    const state = get();
    if (amount > state.floatAmount) {
      return { ok: false, error: "Not enough float in the drawer." };
    }

    set({
      floatAmount: Math.round((state.floatAmount - amount) * 100) / 100,
      statusMessage: `Petty cash £${amount.toFixed(2)} recorded`,
    });
    return { ok: true };
  },

  adjustFloat: (amount) => {
    if (!(amount >= 0)) return { ok: false, error: "Enter a valid float." };
    set({
      floatAmount: Math.round(amount * 100) / 100,
      statusMessage: `Float set to £${amount.toFixed(2)}`,
    });
    return { ok: true };
  },

  printReceipt: () => {
    const state = get();
    if (state.lines.length === 0 && !state.lastReceipt) {
      return { ok: false, error: "No receipt to print." };
    }

    const receipt =
      state.lines.length > 0
        ? buildReceipt(state)
        : (state.lastReceipt as string);

    set({
      lastReceipt: receipt,
      statusMessage: "Receipt sent to printer",
    });
    return { ok: true, receipt };
  },
}));

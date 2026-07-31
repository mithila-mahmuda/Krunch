export type CategoryTone = "drinks" | "food" | "special" | "retail";

export type DiningOption = "eat_in" | "takeaway" | "delivery";

export type SidebarTab = "menu" | "customers" | "orders" | "tables";

export interface Category {
  id: string;
  name: string;
  tone: CategoryTone;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  available?: boolean;
}

export interface Promotion {
  id: string;
  label: string;
  productIds: string[];
  discountedUnitPrice: number;
  requiredQuantity: number;
}

export interface OrderLine {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  /** Staff-entered discount; survives promotion recalculation. */
  manualDiscountAmount: number;
  /** Combined manual + promo discount used for totals. */
  discountAmount: number;
  promotionLabel?: string;
}

export interface HeldOrder {
  id: string;
  number: string;
  lines: OrderLine[];
  diningOption: DiningOption;
  serviceEnabled: boolean;
  customerId: string | null;
  customerName: string | null;
  tableId: string | null;
  tableLabel: string | null;
  heldAt: string;
  total: number;
}

export interface CompletedOrder {
  id: string;
  number: string;
  lines: OrderLine[];
  diningOption: DiningOption;
  serviceEnabled: boolean;
  customerId: string | null;
  customerName: string | null;
  tableId: string | null;
  tableLabel: string | null;
  paidAt: string;
  total: number;
  method: "cash" | "card";
  receipt: string;
  server: string;
}

export interface TenderResult {
  method: "cash" | "card";
  amountTendered: number;
  change: number;
}

export interface OrderTotals {
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  serviceCharge: number;
  tax: number;
  total: number;
  due: number;
}

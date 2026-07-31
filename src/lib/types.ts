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
  discountAmount: number;
  promotionLabel?: string;
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

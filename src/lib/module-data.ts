export type TicketStatus = "open" | "preparing" | "ready" | "paid" | "void";
export type KitchenStatus = "queued" | "preparing" | "ready";
export type TableStatus = "free" | "seated" | "ordered" | "bill";

export interface TicketLine {
  name: string;
  quantity: number;
}

export interface TicketOrder {
  id: string;
  number: string;
  table?: string;
  channel: "eat_in" | "takeaway" | "delivery";
  status: TicketStatus;
  guestName?: string;
  items: TicketLine[];
  total: number;
  placedAt: string;
  server: string;
}

export interface KitchenTicket {
  id: string;
  orderNumber: string;
  table?: string;
  channel: "eat_in" | "takeaway" | "delivery";
  status: KitchenStatus;
  items: TicketLine[];
  notes?: string;
  elapsedMinutes: number;
}

export interface FloorTable {
  id: string;
  label: string;
  seats: number;
  zone: "Main" | "Patio" | "Bar";
  status: TableStatus;
  guestCount?: number;
  openTotal?: number;
  server?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  loyaltyPoints: number;
  lastVisit: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  parLevel: number;
  category: string;
}

export const INITIAL_ORDERS: TicketOrder[] = [
  {
    id: "ord-1042",
    number: "#1042",
    table: "T4",
    channel: "eat_in",
    status: "open",
    guestName: "Harper",
    items: [
      { name: "Classic Burger", quantity: 2 },
      { name: "Fries", quantity: 2 },
      { name: "Cola", quantity: 2 },
    ],
    total: 41.0,
    placedAt: "14:12",
    server: "Maya",
  },
  {
    id: "ord-1041",
    number: "#1041",
    channel: "takeaway",
    status: "preparing",
    guestName: "Alex",
    items: [
      { name: "Latte", quantity: 2 },
      { name: "Club Sandwich", quantity: 1 },
    ],
    total: 15.75,
    placedAt: "14:05",
    server: "Kyle",
  },
  {
    id: "ord-1040",
    number: "#1040",
    table: "T1",
    channel: "eat_in",
    status: "ready",
    items: [
      { name: "Fish & Chips", quantity: 1 },
      { name: "Lager Pint", quantity: 1 },
    ],
    total: 21.15,
    placedAt: "13:48",
    server: "Sam",
  },
  {
    id: "ord-1038",
    number: "#1038",
    channel: "delivery",
    status: "paid",
    guestName: "Jordan",
    items: [
      { name: "Carbonara", quantity: 1 },
      { name: "Garlic Bread", quantity: 1 },
    ],
    total: 17.2,
    placedAt: "13:20",
    server: "Maya",
  },
  {
    id: "ord-1035",
    number: "#1035",
    table: "T7",
    channel: "eat_in",
    status: "void",
    items: [{ name: "Soup of the Day", quantity: 1 }],
    total: 5.5,
    placedAt: "12:55",
    server: "Kyle",
  },
];

export const INITIAL_KITCHEN: KitchenTicket[] = [
  {
    id: "k-1",
    orderNumber: "#1042",
    table: "T4",
    channel: "eat_in",
    status: "queued",
    items: [
      { name: "Classic Burger", quantity: 2 },
      { name: "Fries", quantity: 2 },
    ],
    notes: "No onions on one burger",
    elapsedMinutes: 2,
  },
  {
    id: "k-2",
    orderNumber: "#1041",
    channel: "takeaway",
    status: "preparing",
    items: [{ name: "Club Sandwich", quantity: 1 }],
    elapsedMinutes: 8,
  },
  {
    id: "k-3",
    orderNumber: "#1040",
    table: "T1",
    channel: "eat_in",
    status: "preparing",
    items: [{ name: "Fish & Chips", quantity: 1 }],
    elapsedMinutes: 14,
  },
  {
    id: "k-4",
    orderNumber: "#1039",
    table: "T9",
    channel: "eat_in",
    status: "ready",
    items: [
      { name: "Veg Risotto", quantity: 1 },
      { name: "Side Salad", quantity: 1 },
    ],
    elapsedMinutes: 18,
  },
];

export const INITIAL_TABLES: FloorTable[] = [
  { id: "t1", label: "T1", seats: 2, zone: "Main", status: "ordered", guestCount: 2, openTotal: 21.15, server: "Sam" },
  { id: "t2", label: "T2", seats: 4, zone: "Main", status: "free" },
  { id: "t3", label: "T3", seats: 4, zone: "Main", status: "seated", guestCount: 3, server: "Maya" },
  { id: "t4", label: "T4", seats: 4, zone: "Main", status: "ordered", guestCount: 4, openTotal: 41.0, server: "Maya" },
  { id: "t5", label: "T5", seats: 2, zone: "Main", status: "bill", guestCount: 2, openTotal: 28.4, server: "Kyle" },
  { id: "t6", label: "T6", seats: 6, zone: "Patio", status: "free" },
  { id: "t7", label: "T7", seats: 4, zone: "Patio", status: "free" },
  { id: "t8", label: "T8", seats: 2, zone: "Patio", status: "seated", guestCount: 2, server: "Sam" },
  { id: "b1", label: "B1", seats: 1, zone: "Bar", status: "ordered", guestCount: 1, openTotal: 7.5, server: "Kyle" },
  { id: "b2", label: "B2", seats: 1, zone: "Bar", status: "free" },
  { id: "b3", label: "B3", seats: 2, zone: "Bar", status: "bill", guestCount: 2, openTotal: 16.4, server: "Maya" },
  { id: "b4", label: "B4", seats: 1, zone: "Bar", status: "free" },
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: "c1",
    name: "Harper Wells",
    email: "harper@email.com",
    phone: "07700 900123",
    visits: 18,
    loyaltyPoints: 240,
    lastVisit: "Today",
    notes: "Prefers oat milk",
  },
  {
    id: "c2",
    name: "Alex Chen",
    email: "alex.chen@email.com",
    phone: "07700 900456",
    visits: 7,
    loyaltyPoints: 90,
    lastVisit: "Today",
  },
  {
    id: "c3",
    name: "Jordan Lee",
    email: "jordan@email.com",
    phone: "07700 900789",
    visits: 32,
    loyaltyPoints: 510,
    lastVisit: "Yesterday",
    notes: "Allergic to nuts",
  },
  {
    id: "c4",
    name: "Riley Morgan",
    email: "riley@email.com",
    phone: "07700 900321",
    visits: 4,
    loyaltyPoints: 40,
    lastVisit: "3 days ago",
  },
  {
    id: "c5",
    name: "Samira Khan",
    email: "samira@email.com",
    phone: "07700 900654",
    visits: 12,
    loyaltyPoints: 160,
    lastVisit: "Last week",
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "i1", name: "Espresso beans", unit: "kg", onHand: 4.2, parLevel: 5, category: "Barista" },
  { id: "i2", name: "Whole milk", unit: "L", onHand: 18, parLevel: 20, category: "Barista" },
  { id: "i3", name: "Oat milk", unit: "L", onHand: 6, parLevel: 10, category: "Barista" },
  { id: "i4", name: "Burger patties", unit: "pcs", onHand: 42, parLevel: 40, category: "Mains" },
  { id: "i5", name: "Fries (frozen)", unit: "kg", onHand: 8, parLevel: 12, category: "Sides" },
  { id: "i6", name: "Cod fillets", unit: "pcs", onHand: 9, parLevel: 15, category: "Mains" },
  { id: "i7", name: "Lager keg", unit: "L", onHand: 28, parLevel: 30, category: "Beers" },
  { id: "i8", name: "Brioche buns", unit: "pcs", onHand: 24, parLevel: 30, category: "Mains" },
  { id: "i9", name: "Cheesecake", unit: "slices", onHand: 3, parLevel: 8, category: "Desserts" },
  { id: "i10", name: "Cola syrup", unit: "L", onHand: 2.5, parLevel: 4, category: "Soft Drinks" },
];

export const REPORT_SUMMARY = {
  dateLabel: "Today",
  netSales: 1842.5,
  grossSales: 2211.0,
  orders: 96,
  averageTicket: 19.19,
  covers: 148,
  voids: 3,
  discounts: 86.4,
  topItems: [
    { name: "Latte", qty: 62, revenue: 210.8 },
    { name: "Classic Burger", qty: 28, revenue: 406.0 },
    { name: "Fish & Chips", qty: 19, revenue: 303.05 },
    { name: "Cola", qty: 41, revenue: 102.5 },
  ],
  hourly: [
    { hour: "09", sales: 96 },
    { hour: "10", sales: 142 },
    { hour: "11", sales: 188 },
    { hour: "12", sales: 312 },
    { hour: "13", sales: 365 },
    { hour: "14", sales: 278 },
    { hour: "15", sales: 210 },
  ],
};

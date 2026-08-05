import type { FloorTable, InventoryItem } from "@/lib/module-data";
import { SEED_BRANCH_IDS } from "@/lib/seed-locations";

/** Template table id → stable local key (t1, b2, …). */
export function tableLocalId(tableId: string): string {
  const sep = tableId.lastIndexOf(":");
  return sep >= 0 ? tableId.slice(sep + 1) : tableId;
}

export function scopedTableId(branchId: string, localId: string): string {
  if (localId.includes(":")) return localId;
  return `${branchId}:${localId}`;
}

export function inventoryCatalogKey(itemId: string): string {
  const sep = itemId.lastIndexOf(":");
  return sep >= 0 ? itemId.slice(sep + 1) : itemId;
}

export function scopedInventoryId(branchId: string, catalogKey: string): string {
  if (catalogKey.includes(":")) return catalogKey;
  return `${branchId}:${catalogKey}`;
}

const TABLE_TEMPLATE: Omit<FloorTable, "branchId">[] = [
  { id: "t1", label: "T1", seats: 2, zone: "Main", status: "free" },
  { id: "t2", label: "T2", seats: 4, zone: "Main", status: "free" },
  { id: "t3", label: "T3", seats: 4, zone: "Main", status: "free" },
  { id: "t4", label: "T4", seats: 4, zone: "Main", status: "free" },
  { id: "t5", label: "T5", seats: 2, zone: "Main", status: "free" },
  { id: "t6", label: "T6", seats: 6, zone: "Patio", status: "free" },
  { id: "t7", label: "T7", seats: 4, zone: "Patio", status: "free" },
  { id: "t8", label: "T8", seats: 2, zone: "Patio", status: "free" },
  { id: "b1", label: "B1", seats: 1, zone: "Bar", status: "free" },
  { id: "b2", label: "B2", seats: 1, zone: "Bar", status: "free" },
  { id: "b3", label: "B3", seats: 2, zone: "Bar", status: "free" },
  { id: "b4", label: "B4", seats: 1, zone: "Bar", status: "free" },
];

const INVENTORY_TEMPLATE: Omit<InventoryItem, "branchId">[] = [
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

export function tablesForBranch(branchId: string): FloorTable[] {
  return TABLE_TEMPLATE.map((table) => ({
    ...table,
    id: scopedTableId(branchId, table.id),
    branchId,
    status: "free" as const,
    guestCount: undefined,
    openTotal: undefined,
    server: undefined,
    activeOrderId: null,
  }));
}

export function inventoryForBranch(branchId: string): InventoryItem[] {
  return INVENTORY_TEMPLATE.map((item) => ({
    ...item,
    id: scopedInventoryId(branchId, item.id),
    branchId,
  }));
}

export function tablesForBranches(branchIds: string[]): FloorTable[] {
  return branchIds.flatMap((branchId) => tablesForBranch(branchId));
}

export function inventoryForBranches(branchIds: string[]): InventoryItem[] {
  return branchIds.flatMap((branchId) => inventoryForBranch(branchId));
}

/** Default branch for migrating unscoped legacy rows. */
export function fallbackBranchId(branchIds: string[]): string {
  if (branchIds.includes(SEED_BRANCH_IDS.dhanmondi)) {
    return SEED_BRANCH_IDS.dhanmondi;
  }
  return branchIds[0] ?? SEED_BRANCH_IDS.dhanmondi;
}

export function normalizeTables(
  tables: FloorTable[],
  branchIds: string[],
): { tables: FloorTable[]; changed: boolean } {
  const fallback = fallbackBranchId(branchIds);
  let changed = false;
  const byId = new Map<string, FloorTable>();

  for (const table of tables) {
    const branchId =
      table.branchId && branchIds.includes(table.branchId)
        ? table.branchId
        : fallback;
    const local = tableLocalId(table.id);
    const id = scopedTableId(branchId, local);
    if (table.id !== id || table.branchId !== branchId) changed = true;
    byId.set(id, {
      ...table,
      id,
      branchId,
      label: table.label,
    });
  }

  for (const branchId of branchIds) {
    for (const template of TABLE_TEMPLATE) {
      const id = scopedTableId(branchId, template.id);
      if (!byId.has(id)) {
        changed = true;
        byId.set(id, {
          ...template,
          id,
          branchId,
          status: "free",
          activeOrderId: null,
        });
      }
    }
  }

  return { tables: [...byId.values()], changed };
}

export function normalizeInventory(
  inventory: InventoryItem[],
  branchIds: string[],
): { inventory: InventoryItem[]; changed: boolean } {
  const fallback = fallbackBranchId(branchIds);
  let changed = false;
  const byId = new Map<string, InventoryItem>();

  for (const item of inventory) {
    const catalog = inventoryCatalogKey(item.id);
    const branchId =
      item.branchId && branchIds.includes(item.branchId)
        ? item.branchId
        : fallback;
    const id = scopedInventoryId(branchId, catalog);
    if (item.id !== id || item.branchId !== branchId) changed = true;
    byId.set(id, { ...item, id, branchId });
  }

  for (const branchId of branchIds) {
    for (const template of INVENTORY_TEMPLATE) {
      const id = scopedInventoryId(branchId, template.id);
      if (!byId.has(id)) {
        changed = true;
        byId.set(id, { ...template, id, branchId });
      }
    }
  }

  return { inventory: [...byId.values()], changed };
}

/** Map demo server names onto seed branches. */
export function demoBranchForServer(server: string): string {
  const name = server.trim().toLowerCase();
  if (name === "sam" || name === "riya") return SEED_BRANCH_IDS.gulshan;
  if (name === "nadia") return SEED_BRANCH_IDS.banani;
  return SEED_BRANCH_IDS.dhanmondi;
}

import {
  accessibleBranchIds,
  matchesBranchScope,
} from "@/lib/branch-access";
import { formatMoney, titleCaseLabel } from "@/lib/format";
import { categories } from "@/lib/mock-data";
import { navPagesForRole } from "@/lib/nav";
import { can, canAccessPath } from "@/lib/permissions";
import type { RoleId } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogStore } from "@/store/catalog-store";
import { useCustomerStore } from "@/store/customer-store";
import { useOpsStore } from "@/store/ops-store";
import { useRolesStore } from "@/store/roles-store";
import { useSettingsStore } from "@/store/settings-store";
import { useStaffStore } from "@/store/staff-store";

export type GlobalSearchKind =
  | "page"
  | "staff"
  | "customer"
  | "item"
  | "table"
  | "order"
  | "inventory";

export type GlobalSearchResult = {
  id: string;
  kind: GlobalSearchKind;
  title: string;
  subtitle: string;
  href: string;
  /** When set, selecting an item on POS should add it to the ticket. */
  productId?: string;
};

const KIND_LABEL: Record<GlobalSearchKind, string> = {
  page: "Page",
  staff: "Staff",
  customer: "Customer",
  item: "Item",
  table: "Table",
  order: "Order",
  inventory: "Inventory",
};

export function globalSearchKindLabel(kind: GlobalSearchKind): string {
  return KIND_LABEL[kind];
}

function matches(query: string, ...parts: Array<string | null | undefined>) {
  const haystack = parts.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

function categoryName(categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.name ?? "Menu";
}

function currentRole(): RoleId | null {
  return useAuthStore.getState().user?.role ?? null;
}

/** Build ranked global search hits across pages and live store data. */
export function runGlobalSearch(rawQuery: string, limit = 40): GlobalSearchResult[] {
  const role = currentRole();
  const query = rawQuery.trim().toLowerCase();
  const results: GlobalSearchResult[] = [];
  const branchIds = accessibleBranchIds(
    useAuthStore.getState().user?.branchId,
    useSettingsStore.getState().branches,
  );

  for (const page of navPagesForRole(role)) {
    if (
      !query ||
      matches(query, page.label, page.href, ...page.keywords)
    ) {
      results.push({
        id: `page:${page.href}`,
        kind: "page",
        title: page.label,
        subtitle: page.href,
        href: page.href,
      });
    }
  }

  if (!query) {
    return results.slice(0, limit);
  }

  if (can(role, "manage_users") && canAccessPath(role, "/settings")) {
    const roleName = useRolesStore.getState().roleName;
    for (const staff of useStaffStore.getState().listActive()) {
      const designation = roleName(staff.role);
      if (
        matches(query, staff.name, staff.email, designation, staff.mobile)
      ) {
        results.push({
          id: `staff:${staff.id}`,
          kind: "staff",
          title: staff.name,
          subtitle: `${designation} · ${staff.email}`,
          href: "/settings",
        });
      }
    }
  }

  if (canAccessPath(role, "/customers")) {
    for (const customer of useCustomerStore.getState().customers) {
      if (
        matches(query, customer.name, customer.email, customer.phone, customer.notes)
      ) {
        results.push({
          id: `customer:${customer.id}`,
          kind: "customer",
          title: customer.name,
          subtitle:
            [customer.phone, customer.email].filter(Boolean).join(" · ") ||
            "Customer",
          href: "/customers",
        });
      }
    }
  }

  if (canAccessPath(role, "/pos") || canAccessPath(role, "/menu")) {
    for (const product of useCatalogStore.getState().products) {
      if (matches(query, product.name, categoryName(product.categoryId))) {
        results.push({
          id: `item:${product.id}`,
          kind: "item",
          title: product.name,
          subtitle: `${categoryName(product.categoryId)} · ${formatMoney(product.price)}${
            product.available === false ? " · Sold out" : ""
          }`,
          href: canAccessPath(role, "/pos") ? "/pos" : "/menu",
          productId: canAccessPath(role, "/pos") ? product.id : undefined,
        });
      }
    }
  }

  const ops = useOpsStore.getState();

  if (canAccessPath(role, "/tables")) {
    for (const table of ops.tables) {
      if (!branchIds.includes(table.branchId)) continue;
      if (matches(query, table.label, table.zone, table.server, table.status)) {
        results.push({
          id: `table:${table.id}`,
          kind: "table",
          title: table.label,
          subtitle: `${table.zone} · ${titleCaseLabel(table.status)}${
            table.server ? ` · ${table.server}` : ""
          }`,
          href: "/tables",
        });
      }
    }
  }

  if (canAccessPath(role, "/orders")) {
    for (const order of ops.orders) {
      if (!matchesBranchScope(order, branchIds)) continue;
      const lineNames = order.lines.map((line) => line.name).join(" ");
      if (
        matches(
          query,
          order.number,
          order.customerName,
          order.tableLabel,
          order.server,
          order.status,
          lineNames,
        )
      ) {
        results.push({
          id: `order:${order.id}`,
          kind: "order",
          title: order.number.startsWith("#") ? order.number : `#${order.number}`,
          subtitle: [
            titleCaseLabel(order.status),
            order.customerName,
            order.tableLabel,
            formatMoney(order.total),
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/orders",
        });
      }
    }
  }

  if (canAccessPath(role, "/inventory")) {
    for (const item of ops.inventory) {
      if (!branchIds.includes(item.branchId)) continue;
      if (matches(query, item.name, item.category, item.unit)) {
        results.push({
          id: `inventory:${item.id}`,
          kind: "inventory",
          title: item.name,
          subtitle: `${item.category} · ${item.onHand} ${item.unit} on hand`,
          href: "/inventory",
        });
      }
    }
  }

  const kindRank: Record<GlobalSearchKind, number> = {
    page: 0,
    customer: 1,
    item: 2,
    order: 3,
    table: 4,
    staff: 5,
    inventory: 6,
  };

  return results
    .sort((left, right) => {
      const rankDiff = kindRank[left.kind] - kindRank[right.kind];
      if (rankDiff !== 0) return rankDiff;
      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

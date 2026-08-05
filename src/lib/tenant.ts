/**
 * Local multi-tenant key — same shape we'll use on Supabase later.
 * Every restaurant-owned row carries `restaurantId`.
 */
export const DEMO_RESTAURANT_ID = "rest_demo";

export type TenantScoped = {
  restaurantId: string;
};

/** Strip `restaurantId:` prefix from entity ids (products, etc.). */
export function localEntityKey(restaurantId: string, id: string): string {
  const prefix = `${restaurantId}:`;
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

/** Prefix an id for a restaurant when bare ids would collide across tenants. */
export function tenantEntityId(restaurantId: string, localId: string): string {
  if (!localId || localId.startsWith(`${restaurantId}:`)) return localId;
  // Demo keeps legacy bare ids so existing IDB rows keep working.
  if (restaurantId === DEMO_RESTAURANT_ID) return localId;
  return `${restaurantId}:${localId}`;
}

export function roleIdForRestaurant(
  restaurantId: string,
  roleKey: string,
): string {
  if (roleKey.includes(":")) return roleKey;
  return `${restaurantId}:${roleKey}`;
}

export function roleKeyFromId(roleId: string): string {
  const sep = roleId.lastIndexOf(":");
  if (sep <= 0) return roleId;
  // rest_xxx:admin → admin; custom role ids stay whole if no known pattern
  return roleId.slice(sep + 1);
}

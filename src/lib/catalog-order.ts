/** Stable sort by sortOrder, then name as a tie-breaker. */
export function compareSortOrder(
  left: { sortOrder?: number; name: string },
  right: { sortOrder?: number; name: string },
): number {
  const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return left.name.localeCompare(right.name);
}

export function withSequentialSortOrder<T extends { sortOrder?: number }>(
  items: T[],
): T[] {
  return items.map((item, index) => ({
    ...item,
    sortOrder: item.sortOrder ?? index,
  }));
}

export function applySortOrderByIds<T extends { id: string; sortOrder?: number }>(
  items: T[],
  orderedIds: string[],
): T[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  return items.map((item) =>
    rank.has(item.id) ? { ...item, sortOrder: rank.get(item.id)! } : item,
  );
}

export function moveId(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return ids;
  const fromIndex = ids.indexOf(fromId);
  const toIndex = ids.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0) return ids;
  const next = [...ids];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);
  return next;
}

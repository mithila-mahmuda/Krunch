import type { Branch } from "@/lib/branches";

/** Staff assignment meaning access to every active branch. */
export const ALL_BRANCHES_ID = "*";

export function hasAllBranchAccess(
  branchId: string | null | undefined,
): boolean {
  return branchId === ALL_BRANCHES_ID;
}

export function accessibleBranches(
  assignedBranchId: string | null | undefined,
  branches: Branch[],
): Branch[] {
  const active = branches.filter((branch) => !branch.archived);
  if (hasAllBranchAccess(assignedBranchId)) return active;
  if (!assignedBranchId) return active.slice(0, 1);
  const match = active.find((branch) => branch.id === assignedBranchId);
  return match ? [match] : active.slice(0, 1);
}

export function accessibleBranchIds(
  assignedBranchId: string | null | undefined,
  branches: Branch[],
): string[] {
  return accessibleBranches(assignedBranchId, branches).map(
    (branch) => branch.id,
  );
}

/**
 * Resolve which branch ids a filter should apply.
 * Empty `selected` = all accessible branches (same pattern as channel filters).
 */
export function effectiveBranchIds(
  selected: string[],
  accessible: string[],
): string[] {
  if (accessible.length === 0) return [];
  if (selected.length === 0) return accessible;
  const allowed = new Set(accessible);
  const next = selected.filter((id) => allowed.has(id));
  return next.length > 0 ? next : accessible;
}

/** Order / cash row matches the effective branch set. */
export function matchesBranchScope(
  row: { branchId?: string },
  branchIds: string[],
): boolean {
  if (branchIds.length === 0) return false;
  // Legacy rows without branchId still show (same soft rule as Reports).
  if (!row.branchId) return true;
  return branchIds.includes(row.branchId);
}

import type { Branch } from "@/lib/branches";

export interface TillStation {
  id: string;
  /** Parent location — never use a till as a stand-in for a branch. */
  branchId: string;
  name: string;
  /** Soft-delete — keeps history on old orders readable. */
  archived: boolean;
}

export function newTillId(): string {
  return `till-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createDefaultTills(
  branchId: string,
  name = "TILL 1",
): {
  tills: TillStation[];
  activeTillId: string;
} {
  const id = newTillId();
  return {
    tills: [
      {
        id,
        branchId,
        name: name.trim() || "TILL 1",
        archived: false,
      },
    ],
    activeTillId: id,
  };
}

/** Migrate legacy tills / single tillName onto a branch. */
export function normalizeTills(
  tills: TillStation[] | undefined,
  activeTillId: string | undefined,
  branchId: string,
  legacyTillName?: string,
): { tills: TillStation[]; activeTillId: string } {
  const cleaned = (tills ?? [])
    .map((till) => ({
      id: till.id,
      branchId: till.branchId || branchId,
      name: till.name.trim() || "Till",
      archived: Boolean(till.archived),
    }))
    .filter((till) => Boolean(till.id));

  if (cleaned.length === 0) {
    return createDefaultTills(branchId, legacyTillName ?? "TILL 1");
  }

  // Orphan tills (no matching branch) stay attached to the active branch.
  const withBranch = cleaned.map((till) =>
    till.branchId ? till : { ...till, branchId },
  );

  const inBranch = withBranch.filter(
    (till) => till.branchId === branchId && !till.archived,
  );
  const active =
    withBranch.find((till) => till.id === activeTillId && !till.archived) ??
    inBranch[0] ??
    withBranch.find((till) => !till.archived) ??
    withBranch[0]!;

  return { tills: withBranch, activeTillId: active.id };
}

export function resolveActiveTill(
  tills: TillStation[],
  activeTillId: string,
  branchId?: string,
): TillStation {
  const pool = branchId
    ? tills.filter((till) => till.branchId === branchId)
    : tills;

  return (
    pool.find((till) => till.id === activeTillId && !till.archived) ??
    pool.find((till) => !till.archived) ??
    tills.find((till) => !till.archived) ??
    tills[0] ?? {
      id: "till-fallback",
      branchId: branchId || "branch-fallback",
      name: "TILL 1",
      archived: false,
    }
  );
}

export function tillsForBranch(
  tills: TillStation[],
  branchId: string,
): TillStation[] {
  return tills.filter((till) => till.branchId === branchId && !till.archived);
}

export function nextTillLabel(tills: TillStation[], branchId: string): string {
  const activeCount = tillsForBranch(tills, branchId).length;
  return `TILL ${activeCount + 1}`;
}

/** Ensure every branch has at least one active till. */
export function ensureTillsForBranches(
  branches: Branch[],
  tills: TillStation[],
): TillStation[] {
  const next = [...tills];
  for (const branch of branches) {
    if (branch.archived) continue;
    if (tillsForBranch(next, branch.id).length > 0) continue;
    const seeded = createDefaultTills(branch.id);
    next.push(...seeded.tills);
  }
  return next;
}

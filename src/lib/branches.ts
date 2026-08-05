/**
 * Location hierarchy (scalable target model):
 *   Restaurant (tenant) → Branch (location) → Till (POS station)
 *
 * Do not use tills as branches — a branch can have many tills.
 */

export interface Branch {
  id: string;
  /** Location label, e.g. "Dhanmondi" or "Gulshan". */
  name: string;
  phone: string;
  address: string;
  logoDataUrl: string | null;
  archived: boolean;
  createdAt: string;
}

export function newBranchId(): string {
  return `branch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createDefaultBranch(input?: {
  name?: string;
  phone?: string;
  address?: string;
  logoDataUrl?: string | null;
}): Branch {
  return {
    id: newBranchId(),
    name: input?.name?.trim() || "Main",
    phone: input?.phone?.trim() || "",
    address: input?.address?.trim() || "",
    logoDataUrl: input?.logoDataUrl ?? null,
    archived: false,
    createdAt: new Date().toISOString(),
  };
}

export function normalizeBranches(
  branches: Branch[] | undefined,
  activeBranchId: string | undefined,
  legacy?: {
    name?: string;
    phone?: string;
    address?: string;
    logoDataUrl?: string | null;
  },
): { branches: Branch[]; activeBranchId: string } {
  const cleaned = (branches ?? [])
    .map((branch) => ({
      id: branch.id,
      name: branch.name.trim() || "Branch",
      phone: branch.phone?.trim() || "",
      address: branch.address?.trim() || "",
      logoDataUrl: branch.logoDataUrl ?? null,
      archived: Boolean(branch.archived),
      createdAt: branch.createdAt || new Date().toISOString(),
    }))
    .filter((branch) => Boolean(branch.id));

  if (cleaned.length === 0) {
    const branch = createDefaultBranch({
      name: legacy?.name?.trim() || "Main",
      phone: legacy?.phone,
      address: legacy?.address,
      logoDataUrl: legacy?.logoDataUrl,
    });
    return { branches: [branch], activeBranchId: branch.id };
  }

  const active =
    cleaned.find((branch) => branch.id === activeBranchId && !branch.archived) ??
    cleaned.find((branch) => !branch.archived) ??
    cleaned[0]!;

  return { branches: cleaned, activeBranchId: active.id };
}

export function resolveActiveBranch(
  branches: Branch[],
  activeBranchId: string,
): Branch {
  return (
    branches.find((branch) => branch.id === activeBranchId && !branch.archived) ??
    branches.find((branch) => !branch.archived) ??
    branches[0] ??
    createDefaultBranch()
  );
}

export function nextBranchLabel(branches: Branch[]): string {
  const activeCount = branches.filter((branch) => !branch.archived).length;
  return `Branch ${activeCount + 1}`;
}

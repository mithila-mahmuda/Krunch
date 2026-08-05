import type { Branch } from "@/lib/branches";
import type { TillStation } from "@/lib/tills";

/** Stable demo branch ids — staff seed references these. */
export const SEED_BRANCH_IDS = {
  dhanmondi: "branch-dhanmondi",
  gulshan: "branch-gulshan",
  banani: "branch-banani",
} as const;

/**
 * Sample locations with multiple tills so people on the same branch
 * can switch tills themselves (no special permission).
 */
export function createSeedLocations(): {
  branches: Branch[];
  tills: TillStation[];
  activeBranchId: string;
  activeTillId: string;
} {
  const createdAt = new Date().toISOString();
  const branches: Branch[] = [
    {
      id: SEED_BRANCH_IDS.dhanmondi,
      name: "Dhanmondi",
      phone: "01710000001",
      address: "Road 27, Dhanmondi, Dhaka",
      logoDataUrl: null,
      archived: false,
      createdAt,
    },
    {
      id: SEED_BRANCH_IDS.gulshan,
      name: "Gulshan",
      phone: "01710000002",
      address: "Road 55, Gulshan 2, Dhaka",
      logoDataUrl: null,
      archived: false,
      createdAt,
    },
    {
      id: SEED_BRANCH_IDS.banani,
      name: "Banani",
      phone: "01710000003",
      address: "Block C, Banani, Dhaka",
      logoDataUrl: null,
      archived: false,
      createdAt,
    },
  ];

  const tills: TillStation[] = [
    {
      id: "till-dhan-floor",
      branchId: SEED_BRANCH_IDS.dhanmondi,
      name: "Floor",
      archived: false,
    },
    {
      id: "till-dhan-bar",
      branchId: SEED_BRANCH_IDS.dhanmondi,
      name: "Bar",
      archived: false,
    },
    {
      id: "till-gul-floor",
      branchId: SEED_BRANCH_IDS.gulshan,
      name: "Floor",
      archived: false,
    },
    {
      id: "till-gul-counter",
      branchId: SEED_BRANCH_IDS.gulshan,
      name: "Counter",
      archived: false,
    },
    {
      id: "till-ban-1",
      branchId: SEED_BRANCH_IDS.banani,
      name: "TILL 1",
      archived: false,
    },
    {
      id: "till-ban-2",
      branchId: SEED_BRANCH_IDS.banani,
      name: "TILL 2",
      archived: false,
    },
  ];

  return {
    branches,
    tills,
    activeBranchId: SEED_BRANCH_IDS.dhanmondi,
    activeTillId: "till-dhan-floor",
  };
}

/** Merge missing seed branches/tills into an existing venue (idempotent). */
export function ensureSeedLocations(
  branches: Branch[],
  tills: TillStation[],
): { branches: Branch[]; tills: TillStation[]; changed: boolean } {
  const seed = createSeedLocations();
  let nextBranches = [...branches];
  let nextTills = [...tills];
  let changed = false;

  for (const branch of seed.branches) {
    if (!nextBranches.some((row) => row.id === branch.id)) {
      nextBranches.push(branch);
      changed = true;
    }
  }

  for (const till of seed.tills) {
    if (!nextTills.some((row) => row.id === till.id)) {
      nextTills.push(till);
      changed = true;
    }
  }

  // Archive lone legacy "Main" once seed locations exist and Main has no unique data need.
  const main = nextBranches.find(
    (branch) =>
      !branch.archived &&
      branch.name === "Main" &&
      !Object.values(SEED_BRANCH_IDS).includes(
        branch.id as (typeof SEED_BRANCH_IDS)[keyof typeof SEED_BRANCH_IDS],
      ),
  );
  if (main && nextBranches.filter((branch) => !branch.archived).length > 1) {
    const mainTills = nextTills.filter(
      (till) => till.branchId === main.id && !till.archived,
    );
    // Only archive Main if it still looks like the empty default (no custom phone/address).
    if (!main.phone && !main.address && mainTills.length <= 1) {
      nextBranches = nextBranches.map((branch) =>
        branch.id === main.id ? { ...branch, archived: true } : branch,
      );
      nextTills = nextTills.map((till) =>
        till.branchId === main.id ? { ...till, archived: true } : till,
      );
      changed = true;
    }
  }

  return { branches: nextBranches, tills: nextTills, changed };
}

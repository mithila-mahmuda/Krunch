"use client";

import { useMemo, useState } from "react";
import {
  accessibleBranches,
  effectiveBranchIds,
} from "@/lib/branch-access";
import { useAuthStore } from "@/store/auth-store";
import { useSettingsStore } from "@/store/settings-store";

/** Branch filter state scoped to the signed-in user's access. */
export function useBranchFilter() {
  const assignedBranchId = useAuthStore((state) => state.user?.branchId);
  const branches = useSettingsStore((state) => state.branches);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const restaurantBranches = useMemo(
    () => branches.filter((branch) => !branch.archived),
    [branches],
  );

  const accessible = useMemo(
    () => accessibleBranches(assignedBranchId, branches),
    [assignedBranchId, branches],
  );

  const accessibleIds = useMemo(
    () => accessible.map((branch) => branch.id),
    [accessible],
  );

  const options = useMemo(
    () =>
      accessible.map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    [accessible],
  );

  const branchIds = useMemo(
    () => effectiveBranchIds(selectedBranchIds, accessibleIds),
    [selectedBranchIds, accessibleIds],
  );

  const restaurantBranchCount = restaurantBranches.length;
  const accessibleCount = accessible.length;

  // Filter only when the restaurant has multiple locations AND this user can see more than one.
  const showBranchFilter =
    restaurantBranchCount > 1 && accessibleCount > 1;

  // One location for the venue, or user locked to one — show the name chip for everyone.
  const branchBadgeName = showBranchFilter
    ? null
    : (accessible[0]?.name ?? restaurantBranches[0]?.name ?? null);

  return {
    options,
    selectedBranchIds,
    setSelectedBranchIds,
    branchIds,
    accessibleCount,
    restaurantBranchCount,
    showBranchFilter,
    branchBadgeName,
    /** @deprecated Prefer branchBadgeName */
    singleBranchName: branchBadgeName,
    allLabel:
      accessibleCount <= 1
        ? (accessible[0]?.name ?? "Branch")
        : "All branches",
  };
}

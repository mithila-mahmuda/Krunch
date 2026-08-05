"use client";

import { useEffect } from "react";
import { applyAppearance, readAppearance } from "@/lib/appearance";
import {
  findRestaurantByEmail,
  hydrateRestaurantAccounts,
} from "@/lib/restaurants";
import {
  ensureDemoRestaurantAccount,
  loadRestaurantWorkspace,
  resolveSessionRestaurantId,
} from "@/lib/workspace";
import { useAuthStore } from "@/store/auth-store";
import { useOpsStore } from "@/store/ops-store";
import { usePosStore } from "@/store/pos-store";
import { useSettingsStore } from "@/store/settings-store";
import { useStaffStore } from "@/store/staff-store";

function syncRestaurantProfileFromAccount() {
  const settings = useSettingsStore.getState();
  const user = useAuthStore.getState().user;
  if (!user) return;

  const account = user.email ? findRestaurantByEmail(user.email) : null;
  const patch: {
    restaurantName?: string;
    restaurantPhone?: string;
  } = {};

  if (
    !settings.restaurantName.trim() &&
    (user.restaurantName?.trim() || account?.restaurantName?.trim())
  ) {
    patch.restaurantName =
      user.restaurantName?.trim() || account?.restaurantName?.trim() || "";
  }
  if (!settings.restaurantPhone.trim() && account?.contactNumber?.trim()) {
    patch.restaurantPhone = account.contactNumber.trim();
  }

  if (Object.keys(patch).length > 0) {
    settings.save(patch);
  }
}

function bindSignedInAccount() {
  const user = useAuthStore.getState().user;
  if (!user || !useSettingsStore.getState().hydrated) return;

  const staff = useStaffStore.getState().findById(user.id);
  useSettingsStore.getState().bindToAccount(user.id, {
    branchId: staff?.branchId ?? user.branchId,
  });
}

async function hydrateActiveWorkspace() {
  await hydrateRestaurantAccounts();
  await ensureDemoRestaurantAccount();
  await useAuthStore.getState().hydrate();

  const user = useAuthStore.getState().user;
  if (!user) return;

  const restaurantId = resolveSessionRestaurantId(user);
  if (!restaurantId) return;

  await loadRestaurantWorkspace(restaurantId);
  useStaffStore.getState().ensureAdminAssignee();
  useAuthStore.getState().refreshAssignedBranch();
  bindSignedInAccount();
  syncRestaurantProfileFromAccount();
  if (useSettingsStore.getState().showDemoSeed) {
    useOpsStore.getState().loadDemoSeed();
  }
  useOpsStore.getState().upgradeLegacyReceipts();
  usePosStore.getState().applyServiceDefault();
}

/** Hydrate IndexedDB-backed stores in the background — no blocking splash. */
export function StoreHydrator() {
  useEffect(() => {
    void hydrateActiveWorkspace();
  }, []);

  useEffect(() => {
    let previousRestaurantId =
      useAuthStore.getState().user?.restaurantId ?? null;
    let previousUserId = useAuthStore.getState().user?.id ?? null;

    return useAuthStore.subscribe((state) => {
      const nextUserId = state.user?.id ?? null;
      const nextRestaurantId = state.user?.restaurantId ?? null;

      if (
        nextRestaurantId &&
        nextRestaurantId !== previousRestaurantId
      ) {
        void loadRestaurantWorkspace(nextRestaurantId).then(() => {
          bindSignedInAccount();
          syncRestaurantProfileFromAccount();
          if (useSettingsStore.getState().showDemoSeed) {
            useOpsStore.getState().loadDemoSeed();
          }
          usePosStore.getState().applyServiceDefault();
        });
      } else if (nextUserId && nextUserId !== previousUserId) {
        bindSignedInAccount();
      }

      previousUserId = nextUserId;
      previousRestaurantId = nextRestaurantId;
    });
  }, []);

  useEffect(() => {
    applyAppearance(readAppearance());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readAppearance() === "system") applyAppearance("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}

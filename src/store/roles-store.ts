"use client";

import { create } from "zustand";
import { loadAppRoles, saveAppRoles } from "@/lib/db/repos";
import { queueDbWrite } from "@/lib/db/write";
import { registerRoleLookup, type Permission } from "@/lib/permissions";
import {
  createDefaultRoles,
  migrateRolesTowardAdmin,
  newRoleId,
  type AppRole,
} from "@/lib/roles";
import { DEMO_RESTAURANT_ID, roleIdForRestaurant } from "@/lib/tenant";

export type RoleInput = {
  name: string;
  permissions: Permission[];
};

interface RolesState {
  restaurantId: string | null;
  roles: AppRole[];
  hydrated: boolean;
  hydrateForRestaurant: (restaurantId: string) => Promise<void>;
  hydrate: () => Promise<void>;
  listActive: () => AppRole[];
  findById: (id: string) => AppRole | null;
  roleName: (id: string | undefined | null) => string;
  createRole: (
    input: RoleInput,
  ) => { ok: true; role: AppRole } | { ok: false; error: string };
  updateRole: (
    id: string,
    input: Partial<RoleInput>,
  ) => { ok: true } | { ok: false; error: string };
  archiveRole: (id: string) => { ok: true } | { ok: false; error: string };
}

function persist(roles: AppRole[]) {
  const restaurantId = useRolesStore.getState().restaurantId;
  if (!restaurantId) return;
  queueDbWrite(() => saveAppRoles(restaurantId, roles), "save roles");
}

function normalizeName(name: string) {
  return name.trim();
}

function validateRole(
  input: RoleInput,
  roles: AppRole[],
  excludeId?: string,
): string | null {
  const name = normalizeName(input.name);
  if (!name) return "Enter a role name.";
  if (input.permissions.length === 0) {
    return "Select at least one page or action.";
  }

  const taken = roles.some(
    (role) =>
      !role.archived &&
      role.id !== excludeId &&
      role.name.toLowerCase() === name.toLowerCase(),
  );
  if (taken) return "That role name is already in use.";

  return null;
}

function adminCapableCount(roles: AppRole[], excludeId?: string) {
  return roles.filter(
    (role) =>
      !role.archived &&
      role.id !== excludeId &&
      role.permissions.includes("manage_users") &&
      role.permissions.includes("access_settings"),
  ).length;
}

function wireLookup(roles: AppRole[]) {
  registerRoleLookup((roleId) =>
    roles.find((role) => role.id === roleId && !role.archived),
  );
}

export const useRolesStore = create<RolesState>((set, get) => {
  wireLookup([]);

  return {
    restaurantId: null,
    roles: [],
    hydrated: false,

    hydrateForRestaurant: async (restaurantId) => {
      if (get().hydrated && get().restaurantId === restaurantId) return;
      const loaded = await loadAppRoles(restaurantId);
      const base =
        loaded.length > 0
          ? loaded.map((row) => ({
              ...row,
              restaurantId: row.restaurantId ?? restaurantId,
              permissions: Array.isArray(row.permissions) ? row.permissions : [],
              builtIn: Boolean(row.builtIn),
              archived: Boolean(row.archived),
              createdAt: row.createdAt || new Date().toISOString(),
            }))
          : createDefaultRoles(restaurantId);

      const { roles, changed } = migrateRolesTowardAdmin(base, restaurantId);
      wireLookup(roles);
      set({ restaurantId, roles, hydrated: true });
      if (loaded.length === 0 || changed) persist(roles);
    },

    hydrate: async () => {
      await get().hydrateForRestaurant(get().restaurantId ?? DEMO_RESTAURANT_ID);
    },

    listActive: () => get().roles.filter((role) => !role.archived),

    findById: (id) =>
      get().roles.find((role) => role.id === id && !role.archived) ?? null,

    roleName: (id) => {
      if (!id) return "—";
      const role = get().roles.find((row) => row.id === id);
      return role?.name ?? id;
    },

    createRole: (input) => {
      const error = validateRole(input, get().roles);
      if (error) return { ok: false, error };

      const restaurantId = get().restaurantId ?? DEMO_RESTAURANT_ID;
      const role: AppRole = {
        id: roleIdForRestaurant(restaurantId, newRoleId()),
        restaurantId,
        name: normalizeName(input.name),
        permissions: [...new Set(input.permissions)],
        builtIn: false,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      const roles = [role, ...get().roles];
      wireLookup(roles);
      set({ roles, hydrated: true });
      persist(roles);
      return { ok: true, role };
    },

    updateRole: (id, input) => {
      const existing = get().roles.find((role) => role.id === id && !role.archived);
      if (!existing) return { ok: false, error: "Role not found." };

      const merged: RoleInput = {
        name: input.name ?? existing.name,
        permissions: input.permissions ?? existing.permissions,
      };
      const error = validateRole(merged, get().roles, id);
      if (error) return { ok: false, error };

      const nextPermissions = [...new Set(merged.permissions)];
      const losesAdmin =
        existing.permissions.includes("manage_users") &&
        existing.permissions.includes("access_settings") &&
        !(
          nextPermissions.includes("manage_users") &&
          nextPermissions.includes("access_settings")
        );

      if (losesAdmin && adminCapableCount(get().roles, id) < 1) {
        return {
          ok: false,
          error: "Keep Settings + manage users on at least one role.",
        };
      }

      const roles = get().roles.map((role) =>
        role.id === id
          ? {
              ...role,
              name: normalizeName(merged.name),
              permissions: nextPermissions,
            }
          : role,
      );
      wireLookup(roles);
      set({ roles, hydrated: true });
      persist(roles);
      return { ok: true };
    },

    archiveRole: (id) => {
      const target = get().roles.find((role) => role.id === id && !role.archived);
      if (!target) return { ok: false, error: "Role not found." };

      // Lazy staff check — avoid hard import cycle with staff-store.
      const staffMod = (
        globalThis as typeof globalThis & {
          __krunchStaffAssignedRoleIds?: () => string[];
        }
      ).__krunchStaffAssignedRoleIds;
      const assigned = staffMod?.() ?? [];
      if (assigned.includes(id)) {
        return {
          ok: false,
          error: "Reassign users on this role before removing it.",
        };
      }

      if (
        target.permissions.includes("manage_users") &&
        target.permissions.includes("access_settings") &&
        adminCapableCount(get().roles, id) < 1
      ) {
        return {
          ok: false,
          error: "Keep at least one role that can manage users.",
        };
      }

      const roles = get().roles.map((role) =>
        role.id === id ? { ...role, archived: true } : role,
      );
      wireLookup(roles);
      set({ roles, hydrated: true });
      persist(roles);
      return { ok: true };
    },
  };
});

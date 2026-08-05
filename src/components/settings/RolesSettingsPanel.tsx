"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { can, type Permission } from "@/lib/permissions";
import {
  ACTION_ACCESS_OPTIONS,
  PAGE_ACCESS_OPTIONS,
  toggleActionPermission,
  togglePagePermission,
  type ActionAccessOption,
  type AppRole,
  type PageAccessOption,
} from "@/lib/roles";
import { useAuthStore } from "@/store/auth-store";
import { useRolesStore } from "@/store/roles-store";

const nameFieldClass =
  "min-h-9 w-full min-w-[7rem] rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-slate-800 outline-none ring-[var(--pos-accent)] hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:ring-2 disabled:opacity-60";

function shortLabel(label: string) {
  return label
    .replace("Tabs & Tables", "Tables")
    .replace("Kitchen Display", "Kitchen")
    .replace("Menu Manager", "Menu")
    .replace("POS Till", "POS")
    .replace("Open cash drawer", "Drawer")
    .replace("Adjust float / petty cash", "Float")
    .replace("Apply discounts", "Discount")
    .replace("Void orders", "Void");
}

export function RolesSettingsPanel({ notice }: { notice?: string }) {
  const user = useAuthStore((state) => state.user);
  const roles = useRolesStore((state) => state.roles);
  const createRole = useRolesStore((state) => state.createRole);
  const updateRole = useRolesStore((state) => state.updateRole);
  const archiveRole = useRolesStore((state) => state.archiveRole);

  const canManage = can(user?.role, "manage_users");
  const activeRoles = roles.filter((role) => !role.archived);

  const [error, setError] = useState("");
  const [newRoleName, setNewRoleName] = useState("");

  function setRolePermissions(role: AppRole, permissions: Permission[]) {
    setError("");
    const result = updateRole(role.id, { permissions });
    if (!result.ok) setError(result.error);
  }

  function togglePage(role: AppRole, option: PageAccessOption) {
    if (!canManage) return;
    const enabled = !role.permissions.includes(option.permission);
    setRolePermissions(
      role,
      togglePagePermission(role.permissions, option, enabled),
    );
  }

  function toggleAction(role: AppRole, option: ActionAccessOption) {
    if (!canManage) return;
    const enabled = !role.permissions.includes(option.permission);
    setRolePermissions(
      role,
      toggleActionPermission(role.permissions, option.permission, enabled),
    );
  }

  function renameRole(role: AppRole, name: string) {
    if (!canManage) return;
    const next = name.trim();
    if (!next || next === role.name) return;
    setError("");
    const result = updateRole(role.id, { name: next });
    if (!result.ok) setError(result.error);
  }

  function addRole() {
    if (!canManage) return;
    setError("");
    const result = createRole({
      name: newRoleName.trim() || `Role ${activeRoles.length + 1}`,
      permissions: ["access_pos", "access_orders"],
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewRoleName("");
  }

  function removeRole(id: string) {
    if (!canManage) return;
    setError("");
    const result = archiveRole(id);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-100 pb-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
          Roles
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Admin is the top role with full access. Managers run the floor but
          cannot manage users or roles. Click a cell to grant or revoke access.
        </p>
        {notice ? (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {notice}
          </p>
        ) : null}
      </header>

      {canManage ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={newRoleName}
            onChange={(event) => setNewRoleName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addRole();
              }
            }}
            placeholder="New role name"
            className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-medium outline-none ring-[var(--pos-accent)] focus:ring-2 sm:max-w-xs"
          />
          <button
            type="button"
            onClick={addRole}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-[var(--pos-header)] px-4 text-sm font-semibold text-pos-on-header hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add role
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <AccessMatrix
        title="Page access"
        roles={activeRoles}
        columns={PAGE_ACCESS_OPTIONS.map((option) => ({
          key: option.permission,
          label: shortLabel(option.label),
          title: option.description,
          granted: (role) => role.permissions.includes(option.permission),
          onToggle: (role) => togglePage(role, option),
        }))}
        canManage={canManage}
        onRename={renameRole}
        onRemove={removeRole}
      />

      <AccessMatrix
        title="Till actions"
        roles={activeRoles}
        columns={ACTION_ACCESS_OPTIONS.map((option) => ({
          key: option.permission,
          label: shortLabel(option.label),
          title: option.description,
          granted: (role) => role.permissions.includes(option.permission),
          onToggle: (role) => toggleAction(role, option),
        }))}
        canManage={canManage}
        onRename={renameRole}
        onRemove={removeRole}
        showRoleActions={false}
      />
    </div>
  );
}

type MatrixColumn = {
  key: string;
  label: string;
  title: string;
  granted: (role: AppRole) => boolean;
  onToggle: (role: AppRole) => void;
};

function AccessMatrix({
  title,
  roles,
  columns,
  canManage,
  onRename,
  onRemove,
  showRoleActions = true,
}: {
  title: string;
  roles: AppRole[];
  columns: MatrixColumn[];
  canManage: boolean;
  onRename: (role: AppRole, name: string) => void;
  onRemove: (id: string) => void;
  showRoleActions?: boolean;
}) {
  if (roles.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
        No roles yet. Add a role to start setting page access.
      </p>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Role
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  title={column.title}
                  className="px-1.5 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500"
                >
                  <span className="inline-block max-w-[4.5rem] leading-tight">
                    {column.label}
                  </span>
                </th>
              ))}
              {showRoleActions && canManage ? (
                <th scope="col" className="w-12 px-2 py-2.5">
                  <span className="sr-only">Remove</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={`${title}-${role.id}`} className="border-t border-slate-100">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-2 py-1.5 text-left font-semibold text-slate-800"
                >
                  {showRoleActions ? (
                    <input
                      defaultValue={role.name}
                      disabled={!canManage}
                      onBlur={(event) => onRename(role, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      className={nameFieldClass}
                      aria-label={`Rename ${role.name}`}
                    />
                  ) : (
                    <span className="block px-2 py-1.5 text-sm font-semibold">
                      {role.name}
                    </span>
                  )}
                </th>
                {columns.map((column) => {
                  const on = column.granted(role);
                  return (
                    <td key={column.key} className="p-1 text-center">
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => column.onToggle(role)}
                        title={`${role.name} · ${column.label}: ${on ? "on" : "off"}`}
                        aria-label={`${on ? "Revoke" : "Grant"} ${column.label} for ${role.name}`}
                        aria-pressed={on}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                          on
                            ? "border-[var(--pos-header)] bg-[var(--pos-header)] text-pos-on-header"
                            : "border-slate-200 bg-white text-transparent hover:border-slate-300 hover:bg-slate-50"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </td>
                  );
                })}
                {showRoleActions && canManage ? (
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(role.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`Remove ${role.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

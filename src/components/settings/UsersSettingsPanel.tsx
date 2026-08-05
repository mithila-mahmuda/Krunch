"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { ALL_BRANCHES_ID, hasAllBranchAccess } from "@/lib/branch-access";
import { can } from "@/lib/permissions";
import type { StaffUser } from "@/lib/staff";
import { useAuthStore } from "@/store/auth-store";
import { useRolesStore } from "@/store/roles-store";
import { useSettingsStore } from "@/store/settings-store";
import { useStaffStore, type StaffInput } from "@/store/staff-store";

const cellInputClass =
  "min-h-9 w-full min-w-[6.5rem] rounded-md border border-transparent bg-transparent px-2 text-sm font-medium text-slate-800 outline-none ring-[var(--pos-accent)] hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:ring-2 disabled:opacity-60";

const cellSelectClass =
  "min-h-9 w-full min-w-[6.5rem] rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 outline-none ring-[var(--pos-accent)] focus:ring-2 disabled:opacity-60";

type NewUserDraft = StaffInput;

function emptyDraft(branchId: string, roleId: string): NewUserDraft {
  return {
    name: "",
    mobile: "",
    email: "",
    role: roleId,
    branchId,
    password: "",
  };
}

export function UsersSettingsPanel({
  notice,
}: {
  notice?: string;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const branches = useSettingsStore((state) => state.branches);
  const staff = useStaffStore((state) => state.staff);
  const createStaff = useStaffStore((state) => state.createStaff);
  const updateStaff = useStaffStore((state) => state.updateStaff);
  const archiveStaff = useStaffStore((state) => state.archiveStaff);
  const roles = useRolesStore((state) => state.roles);
  const roleName = useRolesStore((state) => state.roleName);
  const activeRoles = roles.filter((role) => !role.archived);

  const canManage = can(user?.role, "manage_users");
  const activeBranches = branches.filter((branch) => !branch.archived);
  const activeStaff = staff.filter((row) => !row.archived);
  const defaultBranchId =
    user?.branchId ?? activeBranches[0]?.id ?? "";
  const defaultRoleId =
    activeRoles.find((role) => role.id.endsWith(":cashier"))?.id ??
    activeRoles.find((role) => !role.id.endsWith(":admin"))?.id ??
    activeRoles[0]?.id ??
    "cashier";

  const [error, setError] = useState("");
  const [draft, setDraft] = useState<NewUserDraft | null>(null);

  function patchUser(id: string, patch: Partial<StaffInput>) {
    if (!canManage) return;
    setError("");
    const result = updateStaff(id, patch);
    if (!result.ok) setError(result.error);
  }

  function removeStaff(id: string) {
    if (!canManage) return;
    setError("");
    const result = archiveStaff(id);
    if (!result.ok) setError(result.error);
  }

  function openCreate() {
    setError("");
    setDraft(emptyDraft(defaultBranchId, defaultRoleId));
  }

  function saveNewUser() {
    if (!draft || !canManage) return;
    setError("");
    const result = createStaff(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDraft(null);
  }

  function branchName(branchId: string) {
    if (hasAllBranchAccess(branchId)) return "All branches";
    return (
      activeBranches.find((branch) => branch.id === branchId)?.name ??
      "Unassigned"
    );
  }

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
              Users
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Edit cells directly. Role and branch apply immediately; text fields
              save when you leave the cell.
            </p>
            {notice ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {notice}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 rounded-md bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Signed in
            </p>
            <p className="font-semibold">{user?.name ?? "Staff"}</p>
            <p className="text-xs text-slate-500">
              {roleName(user?.role)}
              {user?.branchId ? ` · ${branchName(user.branchId)}` : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.replace("/login");
              }}
              className="mt-2 text-xs font-semibold text-rose-700 hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Team ({activeStaff.length})
        </p>
        {canManage ? (
          <button
            type="button"
            onClick={openCreate}
            disabled={draft != null}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[var(--pos-header)] px-3 text-sm font-semibold text-pos-on-header hover:brightness-110 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add user
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              {(
                [
                  "Name",
                  "Mobile",
                  "Email",
                  "Role",
                  "Branch",
                  "Password",
                  "",
                ] as const
              ).map((heading) => (
                <th
                  key={heading || "actions"}
                  scope="col"
                  className={`px-2 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500 ${
                    heading === "" ? "w-12" : ""
                  }`}
                >
                  {heading || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeStaff.length === 0 && !draft ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  No users yet. Add a person and assign their role and branch.
                </td>
              </tr>
            ) : null}

            {activeStaff.map((row) => (
              <UserRow
                key={row.id}
                row={row}
                isYou={row.id === user?.id}
                canManage={canManage}
                activeRoles={activeRoles}
                activeBranches={activeBranches}
                onPatch={patchUser}
                onRemove={removeStaff}
              />
            ))}

            {draft ? (
              <tr className="border-t border-slate-100 bg-[var(--pos-accent-soft)]/40">
                <td className="px-1 py-1.5">
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    placeholder="Name"
                    className={cellInputClass}
                    autoFocus
                  />
                </td>
                <td className="px-1 py-1.5">
                  <input
                    value={draft.mobile}
                    onChange={(event) =>
                      setDraft({ ...draft, mobile: event.target.value })
                    }
                    placeholder="Mobile"
                    inputMode="tel"
                    className={cellInputClass}
                  />
                </td>
                <td className="px-1 py-1.5">
                  <input
                    value={draft.email}
                    onChange={(event) =>
                      setDraft({ ...draft, email: event.target.value })
                    }
                    placeholder="Email"
                    type="email"
                    className={cellInputClass}
                  />
                </td>
                <td className="px-1 py-1.5">
                  <select
                    value={draft.role}
                    onChange={(event) =>
                      setDraft({ ...draft, role: event.target.value })
                    }
                    className={cellSelectClass}
                  >
                    {activeRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-1 py-1.5">
                  <select
                    value={draft.branchId}
                    onChange={(event) =>
                      setDraft({ ...draft, branchId: event.target.value })
                    }
                    className={cellSelectClass}
                  >
                    <option value={ALL_BRANCHES_ID}>All branches</option>
                    {activeBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-1 py-1.5">
                  <input
                    value={draft.password}
                    onChange={(event) =>
                      setDraft({ ...draft, password: event.target.value })
                    }
                    placeholder="Password"
                    type="password"
                    className={cellInputClass}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={saveNewUser}
                      className="min-h-9 rounded-md bg-[var(--pos-header)] px-2.5 text-xs font-semibold text-pos-on-header hover:brightness-110"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft(null)}
                      className="min-h-9 rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  row,
  isYou,
  canManage,
  activeRoles,
  activeBranches,
  onPatch,
  onRemove,
}: {
  row: StaffUser;
  isYou: boolean;
  canManage: boolean;
  activeRoles: { id: string; name: string }[];
  activeBranches: { id: string; name: string }[];
  onPatch: (id: string, patch: Partial<StaffInput>) => void;
  onRemove: (id: string) => void;
}) {
  const roleOptions =
    activeRoles.some((role) => role.id === row.role)
      ? activeRoles
      : [{ id: row.role, name: row.role }, ...activeRoles];

  return (
    <tr className="border-t border-slate-100">
      <td className="px-1 py-1.5">
        <div className="flex min-w-[8rem] items-center gap-1">
          <input
            key={`${row.id}-name-${row.name}`}
            defaultValue={row.name}
            disabled={!canManage}
            onBlur={(event) => {
              const next = event.target.value.trim();
              if (!next || next === row.name) {
                event.target.value = row.name;
                return;
              }
              onPatch(row.id, { name: next });
            }}
            className={cellInputClass}
            aria-label={`Name for ${row.name}`}
          />
          {isYou ? (
            <span className="shrink-0 text-[10px] font-bold uppercase text-[var(--pos-header)]">
              You
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-1 py-1.5">
        <input
          key={`${row.id}-mobile-${row.mobile}`}
          defaultValue={row.mobile}
          disabled={!canManage}
          onBlur={(event) => {
            const next = event.target.value.trim();
            if (!next || next === row.mobile) {
              event.target.value = row.mobile;
              return;
            }
            onPatch(row.id, { mobile: next });
          }}
          inputMode="tel"
          className={cellInputClass}
          aria-label={`Mobile for ${row.name}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <input
          key={`${row.id}-email-${row.email}`}
          defaultValue={row.email}
          disabled={!canManage}
          onBlur={(event) => {
            const next = event.target.value.trim();
            if (!next || next === row.email) {
              event.target.value = row.email;
              return;
            }
            onPatch(row.id, { email: next });
          }}
          type="email"
          className={cellInputClass}
          aria-label={`Email for ${row.name}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <select
          value={row.role}
          disabled={!canManage}
          onChange={(event) => onPatch(row.id, { role: event.target.value })}
          className={cellSelectClass}
          aria-label={`Role for ${row.name}`}
        >
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-1 py-1.5">
        <select
          value={row.branchId}
          disabled={!canManage}
          onChange={(event) =>
            onPatch(row.id, { branchId: event.target.value })
          }
          className={cellSelectClass}
          aria-label={`Branch for ${row.name}`}
        >
          <option value={ALL_BRANCHES_ID}>All branches</option>
          {activeBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-1 py-1.5">
        <input
          key={`${row.id}-password`}
          defaultValue=""
          disabled={!canManage}
          onBlur={(event) => {
            const next = event.target.value.trim();
            if (!next) return;
            onPatch(row.id, { password: next });
            event.target.value = "";
          }}
          type="password"
          placeholder="••••••••"
          className={cellInputClass}
          aria-label={`New password for ${row.name}`}
          autoComplete="new-password"
        />
      </td>
      <td className="px-2 py-1.5 text-center">
        {canManage ? (
          <button
            type="button"
            disabled={isYou}
            onClick={() => onRemove(row.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
            aria-label={`Remove ${row.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </td>
    </tr>
  );
}

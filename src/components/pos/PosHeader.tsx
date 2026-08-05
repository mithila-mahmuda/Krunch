"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import {
  accessibleBranches,
  hasAllBranchAccess,
} from "@/lib/branch-access";
import { formatTillClock } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { usePosStore } from "@/store/pos-store";
import { useSettingsStore } from "@/store/settings-store";

export function PosHeader() {
  const setNavOpen = usePosStore((state) => state.setNavOpen);
  const user = useAuthStore((state) => state.user);
  const restaurantName = useSettingsStore((state) => state.restaurantName);
  const branches = useSettingsStore((state) => state.branches);
  const activeTillId = useSettingsStore((state) => state.activeTillId);
  const tillName = useSettingsStore((state) => state.tillName);
  const setActiveTill = useSettingsStore((state) => state.setActiveTill);
  const setActiveBranch = useSettingsStore((state) => state.setActiveBranch);
  const getBranchTills = useSettingsStore((state) => state.getBranchTills);
  const getActiveBranch = useSettingsStore((state) => state.getActiveBranch);
  const brandName =
    restaurantName.trim() ||
    user?.restaurantName?.trim() ||
    "Krunch";

  const [now, setNow] = useState<Date | null>(null);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [tillMenuOpen, setTillMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const canSwitchBranch = hasAllBranchAccess(user?.branchId);
  const accessible = accessibleBranches(user?.branchId, branches);
  const activeBranch = getActiveBranch();
  const branchTills = getBranchTills(activeBranch.id);
  const canSwitchTill = branchTills.length > 1;

  useEffect(() => {
    const tick = () => setNow(new Date());
    const immediate = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!tillMenuOpen && !branchMenuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setTillMenuOpen(false);
        setBranchMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTillMenuOpen(false);
        setBranchMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [tillMenuOpen, branchMenuOpen]);

  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2 bg-[var(--pos-header)] px-2 pt-[env(safe-area-inset-top)] text-pos-on-header shadow-sm sm:gap-3 sm:px-3">
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        className="app-header-btn"
        aria-label="Open navigation"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <span
          className="min-w-0 max-w-[9rem] truncate font-[family-name:var(--font-display)] text-lg font-bold tracking-tight sm:max-w-[14rem] sm:text-xl"
          title={brandName}
        >
          {brandName}
        </span>

        <div className="relative flex shrink-0 items-center gap-1.5" ref={menuRef}>
          {canSwitchBranch && accessible.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                setBranchMenuOpen((open) => !open);
                setTillMenuOpen(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={branchMenuOpen}
              title="Switch branch"
              className="app-header-btn app-header-btn--label max-w-[8rem] gap-1 tracking-wide sm:max-w-none"
            >
              <span className="truncate">{activeBranch.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </button>
          ) : (
            <span
              className="app-header-btn app-header-btn--label max-w-[8rem] tracking-wide sm:max-w-none"
              title="Branch is assigned by an admin"
            >
              <span className="truncate">{activeBranch.name}</span>
            </span>
          )}

          {canSwitchTill ? (
            <button
              type="button"
              onClick={() => {
                setTillMenuOpen((open) => !open);
                setBranchMenuOpen(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={tillMenuOpen}
              title="Switch till at this branch"
              className="app-header-btn app-header-btn--label max-w-[7rem] gap-1 tracking-wide sm:max-w-none"
            >
              <span className="truncate">{tillName}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </button>
          ) : (
            <span className="app-header-btn app-header-btn--label max-w-[7rem] tracking-wide sm:max-w-none">
              <span className="truncate">{tillName}</span>
            </span>
          )}

          {branchMenuOpen ? (
            <ul
              role="listbox"
              aria-label="Switch branch"
              className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-slate-800 shadow-lg"
            >
              {accessible.map((branch) => {
                const selected = branch.id === activeBranch.id;
                return (
                  <li key={branch.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBranch(branch.id);
                        setBranchMenuOpen(false);
                      }}
                      className={`flex w-full px-3 py-2 text-left text-sm font-semibold ${
                        selected
                          ? "bg-[var(--pos-accent-soft)] text-[var(--pos-header)]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {branch.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {tillMenuOpen ? (
            <ul
              role="listbox"
              aria-label="Switch till"
              className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-slate-800 shadow-lg sm:left-auto sm:right-0"
            >
              {branchTills.map((till) => {
                const selected = till.id === activeTillId;
                return (
                  <li key={till.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTill(till.id);
                        setTillMenuOpen(false);
                      }}
                      className={`flex w-full px-3 py-2 text-left text-sm font-semibold ${
                        selected
                          ? "bg-[var(--pos-accent-soft)] text-[var(--pos-header)]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {till.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      <p className="hidden min-w-0 shrink truncate text-sm font-medium tracking-wide text-pos-on-header/90 sm:block">
        {user?.name ?? "Staff"}
        {now ? ` · ${formatTillClock(now)}` : ""}
      </p>
      <p className="min-w-0 max-w-[7.5rem] shrink truncate text-xs font-medium tracking-wide text-pos-on-header/90 sm:hidden">
        {user?.name ?? "Staff"}
        {now ? ` · ${formatTillClock(now)}` : ""}
      </p>

      <AppHeaderActions />
    </header>
  );
}

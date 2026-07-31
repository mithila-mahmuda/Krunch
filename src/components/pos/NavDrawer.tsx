"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  CookingPot,
  LayoutGrid,
  Package,
  Settings,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { usePosStore } from "@/store/pos-store";

const links = [
  { href: "/pos", label: "POS Till", icon: LayoutGrid },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/kitchen", label: "Kitchen Display", icon: CookingPot },
  { href: "/tables", label: "Tabs & Tables", icon: UtensilsCrossed },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/menu", label: "Menu Manager", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavDrawer() {
  const open = usePosStore((state) => state.navOpen);
  const setNavOpen = usePosStore((state) => state.setNavOpen);
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close navigation"
        onClick={() => setNavOpen(false)}
      />
      <aside className="relative z-10 flex h-full w-[300px] flex-col bg-[var(--pos-header)] text-white shadow-2xl animate-in">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
              krunch
            </p>
            <p className="text-xs text-white/70">Restaurant Management</p>
          </div>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-auto p-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setNavOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-[var(--pos-header)]"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { CategoryGrid } from "@/components/pos/CategoryGrid";
import { MobileOrderBar } from "@/components/pos/MobileOrderBar";
import { NavDrawer } from "@/components/pos/NavDrawer";
import { OrderSidebar } from "@/components/pos/OrderSidebar";
import { PosHeader } from "@/components/pos/PosHeader";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { StatusToast } from "@/components/pos/StatusToast";
import { usePosStore } from "@/store/pos-store";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

export function PosScreen() {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);
  const setSearchOpen = usePosStore((state) => state.setSearchOpen);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey) return;

      const isSlash = event.key === "/" && !event.ctrlKey && !event.metaKey;
      const isModK =
        event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey);

      if (!isSlash && !isModK) return;
      if (isSlash && isEditableTarget(event.target)) return;

      const { searchOpen, navOpen } = usePosStore.getState();
      if (searchOpen || navOpen) return;

      event.preventDefault();
      setSearchOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchOpen]);

  return (
    <div className="pos-shell flex h-dvh flex-col overflow-hidden bg-[var(--pos-canvas)]">
      <PosHeader />
      <div className="relative flex min-h-0 flex-1">
        <section className="min-w-0 flex-1 overflow-hidden bg-[var(--pos-menu)]">
          {activeCategoryId ? <ProductGrid /> : <CategoryGrid />}
        </section>
        <OrderSidebar />
      </div>
      <MobileOrderBar />
      <NavDrawer />
      <ProductSearch />
      <StatusToast />
    </div>
  );
}

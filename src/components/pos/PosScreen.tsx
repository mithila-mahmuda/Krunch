"use client";

import { CategoryGrid } from "@/components/pos/CategoryGrid";
import { NavDrawer } from "@/components/pos/NavDrawer";
import { OrderSidebar } from "@/components/pos/OrderSidebar";
import { PosHeader } from "@/components/pos/PosHeader";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { usePosStore } from "@/store/pos-store";

export function PosScreen() {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--pos-canvas)]">
      <PosHeader />
      <div className="flex min-h-0 flex-1">
        <section className="min-w-0 flex-1 bg-[var(--pos-menu)]">
          {activeCategoryId ? <ProductGrid /> : <CategoryGrid />}
        </section>
        <OrderSidebar />
      </div>
      <NavDrawer />
    </div>
  );
}

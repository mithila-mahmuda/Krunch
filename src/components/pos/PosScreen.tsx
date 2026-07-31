"use client";

import { CategoryGrid } from "@/components/pos/CategoryGrid";
import { MobileOrderBar } from "@/components/pos/MobileOrderBar";
import { NavDrawer } from "@/components/pos/NavDrawer";
import { OrderSidebar } from "@/components/pos/OrderSidebar";
import { PosHeader } from "@/components/pos/PosHeader";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { StatusToast } from "@/components/pos/StatusToast";
import { usePosStore } from "@/store/pos-store";

export function PosScreen() {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--pos-canvas)]">
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

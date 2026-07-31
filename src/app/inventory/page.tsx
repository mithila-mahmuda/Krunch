"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { InventoryScreen } from "@/components/modules/InventoryScreen";

export default function InventoryPage() {
  return (
    <RequireAuth>
      <InventoryScreen />
    </RequireAuth>
  );
}

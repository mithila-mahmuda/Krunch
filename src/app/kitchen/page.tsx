"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { KitchenScreen } from "@/components/modules/KitchenScreen";

export default function KitchenPage() {
  return (
    <RequireAuth permission="access_kitchen">
      <KitchenScreen />
    </RequireAuth>
  );
}

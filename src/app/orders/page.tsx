"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { OrdersScreen } from "@/components/modules/OrdersScreen";

export default function OrdersPage() {
  return (
    <RequireAuth permission="access_orders">
      <OrdersScreen />
    </RequireAuth>
  );
}

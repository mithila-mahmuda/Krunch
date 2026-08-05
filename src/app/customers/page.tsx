"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { CustomersScreen } from "@/components/modules/CustomersScreen";

export default function CustomersPage() {
  return (
    <RequireAuth permission="access_customers">
      <CustomersScreen />
    </RequireAuth>
  );
}

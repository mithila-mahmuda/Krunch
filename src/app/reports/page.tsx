"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { ReportsScreen } from "@/components/modules/ReportsScreen";

export default function ReportsPage() {
  return (
    <RequireAuth permission="access_reports">
      <ReportsScreen />
    </RequireAuth>
  );
}

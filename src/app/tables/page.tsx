"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { TablesScreen } from "@/components/modules/TablesScreen";

export default function TablesPage() {
  return (
    <RequireAuth permission="access_tables">
      <TablesScreen />
    </RequireAuth>
  );
}

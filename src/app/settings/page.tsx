"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { SettingsScreen } from "@/components/modules/SettingsScreen";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsScreen />
    </RequireAuth>
  );
}

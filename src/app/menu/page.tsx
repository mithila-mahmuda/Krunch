"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { MenuManagerScreen } from "@/components/modules/MenuManagerScreen";

export default function MenuPage() {
  return (
    <RequireAuth permission="access_menu">
      <MenuManagerScreen />
    </RequireAuth>
  );
}

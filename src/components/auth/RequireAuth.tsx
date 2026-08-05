"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import {
  can,
  homePathForRole,
  type Permission,
} from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function RequireAuth({
  children,
  permission,
}: {
  children: ReactNode;
  /** When set, role must have this permission or they are redirected. */
  permission?: Permission;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const mounted = useIsClient();

  const allowed = Boolean(
    user && (!permission || can(user.role, permission)),
  );

  useEffect(() => {
    if (!mounted || !hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (permission && !can(user.role, permission)) {
      router.replace(homePathForRole(user.role));
    }
  }, [mounted, hydrated, user, permission, router]);

  if (!mounted) {
    return (
      <div className="h-dvh bg-[var(--pos-header-deep)]" aria-busy="true" />
    );
  }

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--pos-header-deep)] px-4 text-pos-on-header">
        <p className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
          Checking session…
        </p>
      </div>
    );
  }

  if (!user || !allowed) return null;

  return children;
}

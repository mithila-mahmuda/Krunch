"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuthStore } from "@/store/auth-store";

export function LoginScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && user) {
      router.replace("/pos");
    }
  }, [hydrated, user, router]);

  return (
    <div className="login-shell relative flex min-h-dvh overflow-x-hidden overflow-y-auto">
      <div className="login-atmosphere" aria-hidden="true" />
      <div className="login-grain" aria-hidden="true" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 sm:py-10 lg:px-12">
        <div className="grid w-full items-center gap-5 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <section className="login-hero max-w-xl text-white">
            <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              krunch
            </p>
            <h1 className="mt-3 max-w-md text-xl font-semibold tracking-tight text-white/95 sm:mt-4 sm:text-3xl">
              Sign in to run the floor.
            </h1>
            <p className="mt-2 hidden max-w-md text-base leading-relaxed text-white/75 sm:mt-3 sm:block sm:text-lg">
              One till session for POS, kitchen tickets, tables, and end-of-day
              reports.
            </p>
          </section>

          <section className="login-card w-full max-w-md justify-self-stretch sm:justify-self-start lg:justify-self-end">
            <div className="rounded-2xl border border-white/50 bg-white p-4 shadow-[0_24px_60px_rgba(8,28,54,0.28)] sm:p-8">
              <div className="mb-5">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Staff sign in
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Use your Krunch account to open the till.
                </p>
              </div>
              <LoginForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

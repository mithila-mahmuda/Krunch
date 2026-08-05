"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { homePathForRole } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function SignupScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated && user) {
      router.replace(homePathForRole(user.role));
    }
  }, [hydrated, user, router]);

  return (
    <div className="login-shell relative flex h-dvh overflow-x-hidden overflow-y-auto">
      <div className="login-atmosphere" aria-hidden="true" />
      <div className="login-grain" aria-hidden="true" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-6 lg:px-12">
        <div className="grid w-full items-center gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <section className="login-hero max-w-xl text-white">
            <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              krunch
            </p>
            <h1 className="mt-2 max-w-md text-xl font-semibold tracking-tight text-white/95 sm:mt-3 sm:text-2xl lg:text-3xl">
              Open your restaurant on Krunch.
            </h1>
            <p className="mt-2 hidden max-w-md text-sm leading-relaxed text-white/75 sm:block sm:text-base">
              Create your owner account, then run POS, kitchen tickets, tables,
              and reports from one till.
            </p>
          </section>

          <section className="login-card w-full max-w-xl justify-self-stretch sm:justify-self-center lg:max-w-none lg:justify-self-end">
            <div className="rounded-2xl border border-white/50 bg-white p-4 shadow-[0_24px_60px_rgba(8,28,54,0.28)] sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Restaurant sign up
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set up your venue and owner login in a minute.
                </p>
              </div>
              <SignupForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

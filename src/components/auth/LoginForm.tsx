"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("kyle@krunch.app");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = signIn(email, password);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.replace("/pos");
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      className="login-form flex w-full flex-col gap-5"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={emailId} className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          enterKeyHint="next"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          className="min-h-12 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-[var(--pos-accent)] focus:ring-2 focus:ring-[var(--pos-accent)]/25 user-invalid:border-red-500"
          placeholder="you@restaurant.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={passwordId}
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </label>
          <button
            type="button"
            className="text-sm font-medium text-[var(--pos-accent)] hover:underline"
            onClick={() =>
              window.alert("Password reset will connect to email in a later phase.")
            }
          >
            Forgot password?
          </button>
        </div>

        <div className="relative">
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            enterKeyHint="done"
            required
            minLength={4}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 pr-12 text-base text-slate-900 outline-none transition focus:border-[var(--pos-accent)] focus:ring-2 focus:ring-[var(--pos-accent)]/25 user-invalid:border-red-500"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-800"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--action-pay)] px-4 text-base font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs leading-relaxed text-slate-600">
        Demo: <span className="font-semibold">kyle@krunch.app</span> /{" "}
        <span className="font-semibold">till1234</span>
      </p>
    </form>
  );
}

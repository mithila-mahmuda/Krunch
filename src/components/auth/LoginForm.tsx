"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("kyle@krunch.app");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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

  function handleGoogleSignIn() {
    setError(null);
    setIsGoogleSubmitting(true);

    const result = signInWithGoogle();
    if (!result.ok) {
      setError(result.error);
      setIsGoogleSubmitting(false);
      return;
    }

    router.replace("/pos");
  }

  const isBusy = isSubmitting || isGoogleSubmitting;

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      className="login-form flex w-full flex-col gap-5"
      noValidate
    >
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isBusy}
        className="flex min-h-12 items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold text-slate-800 transition hover:bg-slate-50 enabled:active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
      >
        {isGoogleSubmitting ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" />
            Connecting to Google…
          </>
        ) : (
          <>
            <GoogleIcon />
            Continue with Google
          </>
        )}
      </button>

      <div className="flex items-center gap-3" role="separator" aria-label="or">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          or
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

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
          disabled={isBusy}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          className="min-h-12 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-[var(--pos-accent)] focus:ring-2 focus:ring-[var(--pos-accent)]/25 disabled:opacity-60 user-invalid:border-red-500"
          placeholder="you@restaurant.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
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
            disabled={isBusy}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 pr-12 text-base text-slate-900 outline-none transition focus:border-[var(--pos-accent)] focus:ring-2 focus:ring-[var(--pos-accent)]/25 disabled:opacity-60 user-invalid:border-red-500"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isBusy}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-800 disabled:opacity-60"
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
        disabled={isBusy}
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
        {" · "}
        Google signs in as Kyle
      </p>

      <p className="text-center text-sm text-slate-600">
        New restaurant?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[var(--pos-accent)] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const fieldClassName =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[var(--pos-accent)] focus:ring-2 focus:ring-[var(--pos-accent)]/25 disabled:opacity-60 user-invalid:border-red-500";

export function SignupForm() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);

  const restaurantId = useId();
  const ownerId = useId();
  const emailId = useId();
  const contactId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const errorId = useId();

  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrorOnChange() {
    if (error) setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const result = signUp({
      restaurantName,
      ownerName,
      email,
      contactNumber,
      password,
    });

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
      className="login-form flex w-full flex-col gap-3"
      noValidate
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={restaurantId}
            className="text-sm font-semibold text-slate-700"
          >
            Restaurant name
          </label>
          <input
            id={restaurantId}
            name="restaurantName"
            type="text"
            autoComplete="organization"
            enterKeyHint="next"
            required
            value={restaurantName}
            disabled={isSubmitting}
            onChange={(event) => {
              setRestaurantName(event.target.value);
              clearErrorOnChange();
            }}
            className={fieldClassName}
            placeholder="Harbor Café"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={ownerId}
            className="text-sm font-semibold text-slate-700"
          >
            Your name
          </label>
          <input
            id={ownerId}
            name="ownerName"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            required
            value={ownerName}
            disabled={isSubmitting}
            onChange={(event) => {
              setOwnerName(event.target.value);
              clearErrorOnChange();
            }}
            className={fieldClassName}
            placeholder="Alex Rivera"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={emailId}
            className="text-sm font-semibold text-slate-700"
          >
            Work email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            required
            value={email}
            disabled={isSubmitting}
            onChange={(event) => {
              setEmail(event.target.value);
              clearErrorOnChange();
            }}
            className={fieldClassName}
            placeholder="you@restaurant.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={contactId}
            className="text-sm font-semibold text-slate-700"
          >
            Contact number
          </label>
          <input
            id={contactId}
            name="contactNumber"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            required
            value={contactNumber}
            disabled={isSubmitting}
            onChange={(event) => {
              setContactNumber(event.target.value);
              clearErrorOnChange();
            }}
            className={fieldClassName}
            placeholder="+1 555 123 4567"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={passwordId}
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="next"
              required
              minLength={6}
              value={password}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value);
                clearErrorOnChange();
              }}
              className={`${fieldClassName} pr-11`}
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-800 disabled:opacity-60"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={confirmId}
            className="text-sm font-semibold text-slate-700"
          >
            Confirm password
          </label>
          <input
            id={confirmId}
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            enterKeyHint="done"
            required
            minLength={6}
            value={confirmPassword}
            disabled={isSubmitting}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearErrorOnChange();
            }}
            className={fieldClassName}
            placeholder="Repeat password"
          />
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
        className="mt-0.5 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--action-pay)] px-4 text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create restaurant"
        )}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--pos-accent)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

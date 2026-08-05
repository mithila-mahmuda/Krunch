"use client";

interface CustomerFormFieldsProps {
  name: string;
  email: string;
  phone: string;
  notes: string;
  error: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit?: () => void;
}

export function CustomerFormFields({
  name,
  email,
  phone,
  notes,
  error,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onNotesChange,
  onSubmit,
}: CustomerFormFieldsProps) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <label className="block text-sm font-semibold">
        Name *
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
          autoFocus
        />
      </label>
      <label className="block text-sm font-semibold">
        Phone
        <input
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          inputMode="tel"
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
      </label>
      <label className="block text-sm font-semibold">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
      </label>
      <label className="block text-sm font-semibold">
        Notes
        <input
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Allergies, preferences"
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-[var(--pos-accent)] focus:ring-2"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {/* Hidden submit keeps Enter working when footer button is outside the form */}
      <button type="submit" className="sr-only">
        Save
      </button>
    </form>
  );
}

export function isPlaceholderEmail(email: string): boolean {
  return !email || email.endsWith("@guest.local");
}

export function isPlaceholderPhone(phone: string): boolean {
  return !phone || phone === "—";
}

"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CalendarRange, ChevronDown, Search } from "lucide-react";
import {
  DATE_RANGE_PRESETS,
  dateRangeFromPreset,
  formatDateRangeLabel,
  type DateRangePreset,
  type DateRangeValue,
} from "@/lib/date-range";

export type { DateRangePreset, DateRangeValue };
export {
  dateRangeFromPreset,
  defaultDateRange,
  formatDateRangeLabel,
  dateRangeBounds,
} from "@/lib/date-range";

interface DateRangeSelectProps {
  label?: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Hide field label and use a shorter trigger — for toolbar filter rows. */
  compact?: boolean;
}

export function DateRangeSelect({
  label = "Date range",
  value,
  onChange,
  compact = false,
}: DateRangeSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredPresets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DATE_RANGE_PRESETS;
    return DATE_RANGE_PRESETS.filter((preset) =>
      preset.label.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: globalThis.MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function applyPreset(preset: Exclude<DateRangePreset, "custom">) {
    onChange(dateRangeFromPreset(preset));
    setOpen(false);
    setQuery("");
  }

  function updateCustom(patch: Partial<Pick<DateRangeValue, "from" | "to">>) {
    const next = {
      preset: "custom" as const,
      from: patch.from ?? value.from,
      to: patch.to ?? value.to,
    };
    if (next.from > next.to) {
      if (patch.from) next.to = patch.from;
      else next.from = patch.to!;
    }
    onChange(next);
  }

  return (
    <div ref={rootRef} className="relative block">
      {compact ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center gap-2 rounded-md border border-slate-300 bg-white text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:border-[var(--pos-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--pos-accent)]/20 ${
          compact ? "min-h-10 px-3" : "mt-1 min-h-10 px-3"
        }`}
      >
        <CalendarRange className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="min-w-0 flex-1 truncate">
          {formatDateRangeLabel(value)}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full min-w-[16rem] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg sm:min-w-[18rem]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ranges…"
              className="min-h-8 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-44 overflow-y-auto py-1">
            {filteredPresets.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
            ) : (
              filteredPresets.map((preset) => {
                const selected = value.preset === preset.id;
                return (
                  <li key={preset.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`flex w-full px-3 py-2 text-left text-sm font-medium transition ${
                        selected
                          ? "bg-[var(--pos-accent-soft)] text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-slate-100 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Custom
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block text-xs font-semibold text-slate-500">
                From
                <input
                  type="date"
                  value={value.from}
                  onChange={(event) =>
                    updateCustom({ from: event.target.value })
                  }
                  className="mt-1 min-h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800 outline-none focus:border-[var(--pos-accent)] focus:ring-2 focus:ring-[var(--pos-accent)]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-500">
                To
                <input
                  type="date"
                  value={value.to}
                  onChange={(event) => updateCustom({ to: event.target.value })}
                  className="mt-1 min-h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800 outline-none focus:border-[var(--pos-accent)] focus:ring-2 focus:ring-[var(--pos-accent)]/20"
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

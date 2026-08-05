"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  allLabel: string;
  searchPlaceholder?: string;
  /** Hide field label and use a shorter trigger — for toolbar filter rows. */
  compact?: boolean;
}

function summaryLabel(
  values: string[],
  options: MultiSelectOption[],
  allLabel: string,
): string {
  if (values.length === 0) return allLabel;
  const labels = values
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return allLabel;
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return `${labels.length} selected`;
}

export function SearchableMultiSelect({
  label,
  options,
  values,
  onChange,
  allLabel,
  searchPlaceholder = "Search…",
  compact = false,
}: SearchableMultiSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => new Set(values), [values]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(q),
    );
  }, [options, query]);

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

  function toggleValue(value: string) {
    if (selected.has(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  }

  function clearSelection(event: ReactMouseEvent) {
    event.stopPropagation();
    onChange([]);
  }

  function selectAllVisible() {
    const visibleValues = filtered.map((option) => option.value);
    if (query.trim()) {
      onChange([...new Set([...values, ...visibleValues])]);
      return;
    }
    onChange(options.map((option) => option.value));
  }

  function clearAll() {
    onChange([]);
  }

  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((option) => selected.has(option.value));

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
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
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center gap-2 rounded-md border border-slate-300 bg-white text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:border-[var(--pos-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--pos-accent)]/20 ${
          compact ? "min-h-10 px-3" : "mt-1 min-h-10 px-3"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {summaryLabel(values, options, allLabel)}
        </span>
        {values.length > 0 ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label={`Clear ${label}`}
            onClick={clearSelection}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-h-8 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
            <button
              type="button"
              disabled={filtered.length === 0 || allVisibleSelected}
              onClick={selectAllVisible}
              className="text-xs font-semibold text-[var(--pos-header)] hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              Select all
            </button>
            <button
              type="button"
              disabled={values.length === 0}
              onClick={clearAll}
              className="text-xs font-semibold text-slate-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              Clear all
            </button>
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
            ) : (
              filtered.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <li key={option.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => toggleValue(option.value)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition ${
                        isSelected
                          ? "bg-[var(--pos-accent-soft)] text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-[var(--pos-accent)] bg-[var(--pos-accent)] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

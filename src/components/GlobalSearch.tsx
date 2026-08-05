"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LayoutGrid,
  Package,
  Search,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  globalSearchKindLabel,
  runGlobalSearch,
  type GlobalSearchKind,
  type GlobalSearchResult,
} from "@/lib/global-search";
import { useCatalogStore } from "@/store/catalog-store";
import { usePosStore } from "@/store/pos-store";

const KIND_ICON: Record<GlobalSearchKind, typeof Search> = {
  page: LayoutGrid,
  staff: Users,
  customer: Users,
  item: Package,
  table: UtensilsCrossed,
  order: ClipboardList,
  inventory: Boxes,
};

type GlobalSearchProps = {
  open: boolean;
  onClose: () => void;
};

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  if (!open) return null;
  return <GlobalSearchDialog onClose={onClose} />;
}

function GlobalSearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => runGlobalSearch(query), [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function updateQuery(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function selectResult(result: GlobalSearchResult) {
    if (result.kind === "item" && result.productId && pathname.startsWith("/pos")) {
      const product = useCatalogStore.getState().getProduct(result.productId);
      if (product && product.available !== false) {
        usePosStore.getState().addProduct(product);
        usePosStore.getState().setOrderPanelOpen(true);
      }
      onClose();
      return;
    }

    onClose();
    if (pathname !== result.href) {
      router.push(result.href);
    }
  }

  function onInputKeyDown(event: { key: string; preventDefault: () => void }) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? 0 : Math.min(index + 1, results.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) selectResult(result);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[max(4.5rem,12dvh)] sm:px-4">
      <button
        type="button"
        className="pos-dialog-backdrop absolute inset-0"
        aria-label="Close search"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pos-dialog relative z-10 flex max-h-[min(70dvh,560px)] w-full max-w-xl flex-col overflow-hidden rounded-xl shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <h2 id={titleId} className="sr-only">
            Global search
          </h2>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages, customers, items, orders…"
            aria-controls={listId}
            aria-activedescendant={
              results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined
            }
            className="min-h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="min-h-0 flex-1 overflow-auto overscroll-contain p-2"
        >
          {results.map((result, index) => {
            const Icon = KIND_ICON[result.kind];
            const isActive = index === activeIndex;
            return (
              <li key={result.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  id={`${listId}-${result.id}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectResult(result)}
                  className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition ${
                    isActive ? "bg-[var(--pos-accent-soft)]" : "hover:bg-slate-50"
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {result.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {result.subtitle}
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {globalSearchKindLabel(result.kind)}
                  </span>
                </button>
              </li>
            );
          })}
          {results.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-slate-500">
              No matches for “{query.trim()}”.
            </li>
          ) : null}
        </ul>

        <div className="shrink-0 border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">
          <span className="mr-3">↑↓ navigate</span>
          <span className="mr-3">↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

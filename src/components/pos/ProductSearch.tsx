"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCatalogStore } from "@/store/catalog-store";
import { usePosStore } from "@/store/pos-store";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

export function ProductSearch() {
  const addProduct = usePosStore((state) => state.addProduct);
  const setOrderPanelOpen = usePosStore((state) => state.setOrderPanelOpen);
  const products = useCatalogStore((state) => state.products);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;

  const results = useMemo(() => {
    const available = products.filter((product) => product.available !== false);
    if (!isSearching) return [];
    const q = trimmed.toLowerCase();
    return available
      .filter((product) => product.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [isSearching, products, trimmed]);

  function openSearch() {
    setExpanded(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeSearch() {
    setExpanded(false);
    setQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey) return;
      if (event.key !== "/" || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;
      if (usePosStore.getState().navOpen) return;

      event.preventDefault();
      openSearch();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!expanded) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeSearch();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeSearch();
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute bottom-4 right-3 z-30 sm:bottom-5 sm:right-4"
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) {
          setExpanded(true);
        }
      }}
      onMouseLeave={() => {
        if (
          window.matchMedia("(hover: hover)").matches &&
          !query &&
          document.activeElement !== inputRef.current
        ) {
          setExpanded(false);
        }
      }}
    >
      <div
        className={`pointer-events-auto ml-auto flex flex-col items-stretch gap-2 transition-[width] duration-200 ease-out ${
          expanded ? "w-[min(22rem,calc(100%-0.5rem))]" : "w-12"
        }`}
      >
        {expanded && isSearching ? (
          <div className="max-h-[min(50dvh,22rem)] overflow-auto overscroll-contain rounded-xl border border-white/15 bg-[color-mix(in_srgb,#0f2744_92%,transparent)] shadow-2xl backdrop-blur-md">
            <ul className="p-1.5">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      addProduct(product);
                      closeSearch();
                      setOrderPanelOpen(true);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {product.name}
                    </span>
                    <span className="shrink-0 font-medium text-white/80">
                      {formatMoney(product.price)}
                    </span>
                  </button>
                </li>
              ))}
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-white/70">
                  No items match “{trimmed}”.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div
          className={`flex h-12 items-center overflow-hidden rounded-full border border-white/20 bg-[color-mix(in_srgb,#0f2744_88%,transparent)] shadow-lg backdrop-blur-md transition-[padding] duration-200 ${
            expanded ? "pl-3 pr-1.5" : "px-0"
          }`}
        >
          {expanded ? (
            <>
              <Search className="h-4 w-4 shrink-0 text-white/55" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setExpanded(true)}
                placeholder="Search items"
                aria-label="Search items"
                aria-keyshortcuts="/"
                className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white outline-none placeholder:text-white/45"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close item search"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search items"
              aria-keyshortcuts="/"
              title="Search items (/)"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Search, Sun } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { applyAppearance } from "@/lib/appearance";
import { useAuthStore } from "@/store/auth-store";
import { usePosStore } from "@/store/pos-store";

function subscribeDark(onStoreChange: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(onStoreChange);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function readIsDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function AppHeaderActions() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const isDark = useSyncExternalStore(subscribeDark, readIsDark, () => false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey) return;

      const isModK =
        event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey);
      if (!isModK) return;
      if (usePosStore.getState().navOpen) return;

      event.preventDefault();
      setSearchOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleAppearance() {
    applyAppearance(isDark ? "light" : "dark");
  }

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="app-header-btn"
          aria-label="Search"
          aria-keyshortcuts="Control+K Meta+K"
          title="Search (Ctrl+K)"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={toggleAppearance}
          className="app-header-btn"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="app-header-btn app-header-btn--danger"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

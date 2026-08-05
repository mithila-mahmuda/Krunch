export type AppearanceMode = "light" | "dark" | "system";

export const APPEARANCE_KEY = "krunch-appearance";

export const APPEARANCE_BOOTSTRAP = `(function(){try{var d=document.documentElement;var a=localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)})||"system";var dark=a==="dark"||(a!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light"}catch(e){}})();`;

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

export function readAppearance(): AppearanceMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(APPEARANCE_KEY);
    return isAppearanceMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveDark(mode: AppearanceMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyAppearance(mode: AppearanceMode): void {
  if (typeof document === "undefined") return;
  const dark = resolveDark(mode);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  try {
    localStorage.setItem(APPEARANCE_KEY, mode);
  } catch {
    // Private mode / quota — DOM still updates for this session.
  }
}

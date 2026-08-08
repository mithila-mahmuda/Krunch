import type { Category, CategoryTone } from "@/lib/types";

/** Preset till-tile colours managers can pick from. */
export const CATEGORY_COLOR_PRESETS = [
  { id: "red", label: "Red", value: "#d64545" },
  { id: "green", label: "Green", value: "#2f9e44" },
  { id: "blue", label: "Blue", value: "#3b82c4" },
  { id: "yellow", label: "Yellow", value: "#ca8a04" },
] as const;

export const DEFAULT_CATEGORY_COLOR: string = CATEGORY_COLOR_PRESETS[2]!.value;

const TONE_COLORS: Record<CategoryTone, string> = {
  drinks: "#2f9e44",
  food: "#3b82c4",
  special: "#d64545",
  retail: "#6b7280",
};

const HEX_COLOR = /^#([0-9a-f]{6})$/i;

/** Normalize a colour string to `#rrggbb`, or null if invalid. */
export function normalizeCategoryColor(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_COLOR.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

/** Resolve the display colour for a category, including legacy tone rows. */
export function resolveCategoryColor(
  category: Pick<Category, "color" | "tone"> | null | undefined,
): string {
  if (!category) return DEFAULT_CATEGORY_COLOR;
  const fromColor = category.color
    ? normalizeCategoryColor(category.color)
    : null;
  if (fromColor) return fromColor;
  if (category.tone && TONE_COLORS[category.tone]) {
    return TONE_COLORS[category.tone];
  }
  return DEFAULT_CATEGORY_COLOR;
}

import {
  endOfDay,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7"
  | "last_30"
  | "custom";

export interface DateRangeValue {
  preset: DateRangePreset;
  from: string;
  to: string;
}

export const DATE_RANGE_PRESETS: {
  id: Exclude<DateRangePreset, "custom">;
  label: string;
}[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7", label: "Last 7 days" },
  { id: "last_30", label: "Last 30 days" },
];

function toInputDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function dateRangeFromPreset(
  preset: Exclude<DateRangePreset, "custom">,
  now = new Date(),
): DateRangeValue {
  if (preset === "today") {
    const day = toInputDate(now);
    return { preset, from: day, to: day };
  }
  if (preset === "yesterday") {
    const day = toInputDate(subDays(now, 1));
    return { preset, from: day, to: day };
  }
  if (preset === "last_7") {
    return {
      preset,
      from: toInputDate(subDays(now, 6)),
      to: toInputDate(now),
    };
  }
  return {
    preset,
    from: toInputDate(subDays(now, 29)),
    to: toInputDate(now),
  };
}

export function defaultDateRange(now = new Date()): DateRangeValue {
  return dateRangeFromPreset("today", now);
}

export function formatDateRangeLabel(value: DateRangeValue): string {
  const preset = DATE_RANGE_PRESETS.find((item) => item.id === value.preset);
  if (preset) return preset.label;
  if (value.from === value.to) {
    try {
      return format(parseISO(value.from), "d MMM yyyy");
    } catch {
      return value.from;
    }
  }
  try {
    return `${format(parseISO(value.from), "d MMM")} – ${format(parseISO(value.to), "d MMM yyyy")}`;
  } catch {
    return `${value.from} – ${value.to}`;
  }
}

export function dateRangeBounds(value: DateRangeValue): {
  start: Date;
  end: Date;
} {
  const start = startOfDay(parseISO(value.from));
  const end = endOfDay(parseISO(value.to));
  return { start, end };
}

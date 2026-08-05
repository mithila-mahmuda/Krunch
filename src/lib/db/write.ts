"use client";

/** Fire-and-forget write so UI stays snappy. */
export function queueDbWrite(
  write: () => Promise<void>,
  label: string,
): void {
  void write().catch((error) => {
    console.error(`[krunch-db] ${label} failed`, error);
  });
}

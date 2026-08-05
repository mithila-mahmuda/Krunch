"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True after hydration on the client; false during SSR. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

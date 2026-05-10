// Request-scoped marker that any read used the JSON fallback.
// Implemented via React's `cache` so it's per-request in App Router.
import { cache } from "react";

interface Flag { fellBack: boolean }

const getFlagBox = cache((): Flag => ({ fellBack: false }));

export function markFallbackUsed(): void {
  getFlagBox().fellBack = true;
}

export function didFallback(): boolean {
  return getFlagBox().fellBack;
}

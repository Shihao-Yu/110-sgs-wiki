/**
 * Session recorder storage adapter.
 *
 * Intentionally separate from `entity-store.ts`: session state must NOT fall
 * back to bundled JSON on Redis failure (would silently let stale defaults
 * overwrite real session data on next PUT). Reads fail loud (caller returns
 * 503); writes use compare-and-swap on `revision`.
 */
import { Redis } from "@upstash/redis";

export interface SessionPlayer {
  name: string;
  generals: [string | null, string | null];
}

export interface Session {
  revision: number;
  playerCount: number;
  players: SessionPlayer[];
  updatedAt: string;
}

const KEY = "session:current";
const REDIS_TIMEOUT_MS = 3000;

let _redis: Redis | null = null;
function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!_redis) _redis = new Redis({ url, token });
  return _redis;
}

/** Test-only: reset the singleton + connection. */
export function __resetForTests(): void {
  _redis = null;
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Redis timeout after ${ms}ms (${label})`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function defaultSession(): Session {
  return {
    revision: 0,
    playerCount: 5,
    players: Array.from({ length: 5 }, () => ({ name: "", generals: [null, null] })),
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Reads current session. Returns the default session when Redis has no value
 * (first-ever read). Throws if Redis is unreachable so callers can return 503.
 */
export async function getSession(): Promise<Session> {
  const r = redis();
  if (!r) {
    throw new Error("Redis not configured (session-store)");
  }
  const v = await withTimeout(r.get<Session>(KEY), REDIS_TIMEOUT_MS, KEY);
  return v ?? defaultSession();
}

export type PutResult =
  | { ok: true; value: Session }
  | { ok: false; reason: "conflict"; current: Session };

/**
 * Compare-and-swap PUT. Caller passes `ifRevision` (the revision their UI was
 * showing); we only write if the current revision matches. On mismatch we
 * return the latest session for the caller to merge/show.
 */
export async function putSession(
  ifRevision: number,
  next: Omit<Session, "revision" | "updatedAt">,
): Promise<PutResult> {
  const r = redis();
  if (!r) {
    throw new Error("Redis not configured (session-store)");
  }
  const current = (await withTimeout(r.get<Session>(KEY), REDIS_TIMEOUT_MS, KEY)) ?? defaultSession();
  if (current.revision !== ifRevision) {
    return { ok: false, reason: "conflict", current };
  }
  const written: Session = {
    ...next,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  await withTimeout(r.set(KEY, written), REDIS_TIMEOUT_MS, `${KEY}:set`);
  return { ok: true, value: written };
}

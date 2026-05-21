import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _loginLimiter: Ratelimit | null = null;
let _syncSearchLimiter: Ratelimit | null = null;
let _sessionWriteLimiter: Ratelimit | null = null;
let _sessionReadLimiter: Ratelimit | null = null;

function redis(): Redis | null {
  // Accept either Upstash-standard or Vercel-Marketplace (KV_*) naming.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function loginLimiter(): Ratelimit | null {
  if (_loginLimiter) return _loginLimiter;
  const r = redis();
  if (!r) return null;
  _loginLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, "15 m"),  // 5 attempts / 15 min / IP
    prefix: "ratelimit:login",
  });
  return _loginLimiter;
}

export function syncSearchLimiter(): Ratelimit | null {
  if (_syncSearchLimiter) return _syncSearchLimiter;
  const r = redis();
  if (!r) return null;
  _syncSearchLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.fixedWindow(1, "90 s"),    // 1 deploy trigger / 90 s globally
    prefix: "ratelimit:sync-search",
  });
  return _syncSearchLimiter;
}

export function sessionWriteLimiter(): Ratelimit | null {
  if (_sessionWriteLimiter) return _sessionWriteLimiter;
  const r = redis();
  if (!r) return null;
  _sessionWriteLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 PUTs / minute / IP
    prefix: "ratelimit:session-write",
  });
  return _sessionWriteLimiter;
}

export function sessionReadLimiter(): Ratelimit | null {
  if (_sessionReadLimiter) return _sessionReadLimiter;
  const r = redis();
  if (!r) return null;
  _sessionReadLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(180, "1 m"), // 180 GETs / minute / IP (5s poll * up to ~15 tabs)
    prefix: "ratelimit:session-read",
  });
  return _sessionReadLimiter;
}

let _ratingsLimiter: Ratelimit | null = null;

export function ratingsLimiter(): Ratelimit | null {
  if (_ratingsLimiter) return _ratingsLimiter;
  const r = redis();
  if (!r) return null;
  _ratingsLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "1 m"),  // 10 votes / minute / IP
    prefix: "ratelimit:ratings",
  });
  return _ratingsLimiter;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

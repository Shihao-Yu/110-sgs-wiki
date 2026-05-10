import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _loginLimiter: Ratelimit | null = null;
let _syncSearchLimiter: Ratelimit | null = null;

function redis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
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

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

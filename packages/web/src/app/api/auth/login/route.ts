import { NextResponse } from "next/server";
import { passwordMatches, signSessionCookie } from "@/lib/auth";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";
import { loginLimiter, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limiter = loginLimiter();
  if (limiter) {
    const ip = clientIp(req);
    const r = await limiter.limit(ip);
    if (!r.success) {
      const res = NextResponse.json(
        { error: "too-many-attempts", retryInSeconds: Math.ceil((r.reset - Date.now()) / 1000) },
        { status: 429 },
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = typeof body.password === "string" ? body.password : "";

  if (!passwordMatches(password, process.env.ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 250));
    const res = NextResponse.json({ error: "invalid-password" }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    const res = NextResponse.json({ error: "server-misconfigured" }, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const ttl = 60 * 60 * 24 * 30;
  const token = signSessionCookie({ ttlSeconds: ttl }, secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttl,
    path: "/",
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

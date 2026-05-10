import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "./auth";

export const ADMIN_COOKIE_NAME = "admin_session";
export const MAX_BODY_BYTES = 50 * 1024; // 50 KB body cap

/**
 * Verifies admin auth and request hygiene.
 * Returns NextResponse on rejection (caller should `return` it). Returns null on pass.
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn("[auth-gate] SESSION_SECRET is not set; admin endpoints will reject all requests");
    return NextResponse.json({ error: "server-misconfigured" }, { status: 500 });
  }

  const expectedHost = req.headers.get("host");
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const checkSource = origin ?? referer;
  if (checkSource && expectedHost) {
    try {
      const u = new URL(checkSource);
      if (u.host !== expectedHost) {
        return NextResponse.json({ error: "origin-mismatch" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "invalid-origin" }, { status: 403 });
    }
  }

  const c = await cookies();
  const token = c.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = verifySessionCookie(token, secret);
  if (!r.ok) return NextResponse.json({ error: "unauthorized", reason: r.reason }, { status: 401 });

  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload-too-large", limit: MAX_BODY_BYTES }, { status: 413 });
  }

  return null;
}

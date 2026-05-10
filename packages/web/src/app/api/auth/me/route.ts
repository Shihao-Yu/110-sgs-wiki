import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn("[auth/me] SESSION_SECRET missing — admin login will not work");
    const res = NextResponse.json({ authed: false });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE_NAME)?.value;
  const ok = token ? verifySessionCookie(token, secret).ok : false;
  const res = NextResponse.json({ authed: ok });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

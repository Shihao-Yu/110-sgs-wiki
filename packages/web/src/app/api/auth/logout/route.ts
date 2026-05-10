import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

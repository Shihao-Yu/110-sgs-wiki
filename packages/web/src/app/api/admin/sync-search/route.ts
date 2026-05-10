import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-gate";
import { syncSearchLimiter } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (gate) return gate;

  const limiter = syncSearchLimiter();
  if (limiter) {
    const r = await limiter.limit("global");
    if (!r.success) {
      const wait = Math.ceil((r.reset - Date.now()) / 1000);
      return NextResponse.json({ error: "rate-limited", retryInSeconds: wait }, { status: 429 });
    }
  }

  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return NextResponse.json({ error: "deploy-hook-not-configured" }, { status: 500 });

  try {
    const r = await fetch(url, { method: "POST" });
    if (!r.ok) return NextResponse.json({ error: "deploy-hook-failed", status: r.status }, { status: 502 });
    const res = NextResponse.json(
      { ok: true, message: "Search index will refresh after the next deploy completes (~60-90s)." },
      { status: 202 },
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    return NextResponse.json({ error: "deploy-hook-error", detail: String(e) }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getSession, putSession } from "@/lib/session-store";
import { validateSessionInput } from "@/lib/validators";
import { sessionReadLimiter, sessionWriteLimiter, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 50 * 1024;

function noStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET(req: Request) {
  const limiter = sessionReadLimiter();
  if (limiter) {
    const r = await limiter.limit(clientIp(req));
    if (!r.success) {
      return noStore(NextResponse.json({ error: "rate-limited" }, { status: 429 }));
    }
  }

  try {
    const s = await getSession();
    return noStore(NextResponse.json(s));
  } catch (e) {
    console.error("[/api/session GET] redis read failed", e);
    return noStore(NextResponse.json({ error: "session-unavailable" }, { status: 503 }));
  }
}

export async function PUT(req: Request) {
  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY_BYTES) {
    return noStore(NextResponse.json({ error: "payload-too-large", limit: MAX_BODY_BYTES }, { status: 413 }));
  }

  const limiter = sessionWriteLimiter();
  if (limiter) {
    const r = await limiter.limit(clientIp(req));
    if (!r.success) {
      return noStore(NextResponse.json({ error: "rate-limited", retryInSeconds: Math.ceil((r.reset - Date.now()) / 1000) }, { status: 429 }));
    }
  }

  const body = await req.json().catch(() => null);
  const result = validateSessionInput(body);
  if (!result.ok) {
    return noStore(NextResponse.json({ errors: result.errors }, { status: 422 }));
  }

  const { ifRevision, playerCount, players } = result.value;
  try {
    const r = await putSession(ifRevision, { playerCount, players });
    if (!r.ok) {
      return noStore(NextResponse.json({ error: "conflict", current: r.current }, { status: 409 }));
    }
    return noStore(NextResponse.json({ ok: true, value: r.value }));
  } catch (e) {
    console.error("[/api/session PUT] redis write failed", e);
    return noStore(NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 }));
  }
}

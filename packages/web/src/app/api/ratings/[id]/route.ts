import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { clientIp, ratingsLimiter } from "@/lib/ratelimit";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import { isRatingTier, topTier, type RatingTier } from "@/lib/ratings";
import type { GeneralId } from "@sgs/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VoteBody {
  from?: RatingTier | null;
  to?: RatingTier;
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 12);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const limiter = ratingsLimiter();
  if (limiter) {
    const ip = clientIp(req);
    const { success, reset } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "rate-limited", retryAfter: reset },
        { status: 429 },
      );
    }
  }

  const general = await entityStore.getGeneral(id as GeneralId);
  if (!general) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as VoteBody | null;
  if (!body || !isRatingTier(body.to)) {
    return NextResponse.json({ error: "invalid-tier", field: "to" }, { status: 400 });
  }
  const from = body.from ?? null;
  if (from !== null && !isRatingTier(from)) {
    return NextResponse.json({ error: "invalid-tier", field: "from" }, { status: 400 });
  }

  let updated;
  try {
    updated = await entityStore.updateRating(id, from, body.to, hashIp(clientIp(req)));
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  for (const p of pathsToRevalidate({ type: "rating", id })) {
    try { revalidatePath(p); } catch { /* best-effort */ }
  }

  const res = NextResponse.json({
    ok: true,
    counts: updated.counts,
    total: updated.total,
    topTier: topTier(updated),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

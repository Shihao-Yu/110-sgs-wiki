import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { validateGeneralPatch } from "@/lib/validators";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import type { General, GeneralId } from "@sgs/data";
import { requireAdmin } from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GeneralWithMeta extends General {
  updatedAt?: string;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin(req);
  if (gate) return gate;

  const { id } = await ctx.params;
  const old = (await entityStore.getGeneral(id as GeneralId)) as GeneralWithMeta | null;

  const ifMatch = req.headers.get("if-match");
  if (ifMatch && old?.updatedAt && ifMatch !== old.updatedAt) {
    return NextResponse.json(
      {
        error: "conflict",
        message: "another admin edited this entity since you loaded it; reload and re-apply your changes",
        currentUpdatedAt: old.updatedAt,
      },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const result = validateGeneralPatch(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const updatedAt = new Date().toISOString();
  const next: GeneralWithMeta = {
    ...(old ?? ({} as GeneralWithMeta)),
    ...(result.value as Partial<General>),
    id: id as GeneralId,
    updatedAt,
  } as GeneralWithMeta;

  try {
    await entityStore.putGeneral(id as GeneralId, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  const failed: string[] = [];
  const revalidated: string[] = [];
  for (const p of pathsToRevalidate({ type: "general", id, oldValue: old ?? undefined, newValue: next })) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      failed.push(p);
    }
  }

  const res = NextResponse.json({ ok: true, value: next, revalidated, revalidateFailed: failed });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

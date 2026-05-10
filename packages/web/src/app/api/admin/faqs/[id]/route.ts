import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { validateFaqInput } from "@/lib/validators";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import type { FAQ, FAQId } from "@sgs/data";
import { requireAdmin } from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FaqWithMeta extends FAQ {
  updatedAt?: string;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin(req);
  if (gate) return gate;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const result = validateFaqInput(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const old = (await entityStore.getFaq(id as FAQId)) as FaqWithMeta | null;
  if (!old) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const updatedAt = new Date().toISOString();
  const next: FaqWithMeta = { ...old, ...(result.value as Partial<FAQ>), id: id as FAQId, updatedAt };

  try {
    await entityStore.putFaq(id as FAQId, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  const failed: string[] = [];
  const revalidated: string[] = [];
  for (const p of pathsToRevalidate({ type: "faq", id, oldValue: old, newValue: next })) {
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

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin(req);
  if (gate) return gate;

  const { id } = await ctx.params;
  const old = (await entityStore.getFaq(id as FAQId)) as FaqWithMeta | null;
  if (!old) return NextResponse.json({ error: "not-found" }, { status: 404 });

  try {
    await entityStore.deleteFaq(id as FAQId);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  const failed: string[] = [];
  const revalidated: string[] = [];
  for (const p of pathsToRevalidate({ type: "faq", id, oldValue: old })) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      failed.push(p);
    }
  }

  const res = NextResponse.json({ ok: true, revalidated, revalidateFailed: failed });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
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

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const result = validateFaqInput(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const id = `faq_${nanoid(8)}` as FAQId;
  const updatedAt = new Date().toISOString();
  const next: FaqWithMeta = { id, ...result.value, updatedAt } as FaqWithMeta;

  try {
    await entityStore.putFaq(id, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  const failed: string[] = [];
  const revalidated: string[] = [];
  for (const p of pathsToRevalidate({ type: "faq", id, newValue: next })) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      failed.push(p);
    }
  }

  const res = NextResponse.json({ ok: true, value: next, revalidated, revalidateFailed: failed }, { status: 201 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [generals, faqs] = await Promise.all([entityStore.getGenerals(), entityStore.getFaqs()]);
    return NextResponse.json({
      status: "ok",
      generals_count: generals.length,
      faqs_count: faqs.length,
    });
  } catch (e) {
    return NextResponse.json({ status: "degraded", error: String(e) }, { status: 503 });
  }
}

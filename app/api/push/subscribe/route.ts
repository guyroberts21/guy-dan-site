import { NextResponse } from "next/server";
import { ensureSchema, savePushSubscription, deletePushSubscription } from "@/lib/db";
import type { Author } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => null);
  const { author, subscription } = body ?? {};

  if (author !== "guy" && author !== "dan") {
    return NextResponse.json({ error: "Invalid author" }, { status: 400 });
  }
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription(author as Author, subscription);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => null);
  const { endpoint } = body ?? {};

  if (!endpoint || typeof endpoint !== "string") {
    return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
  }

  await deletePushSubscription(endpoint);
  return NextResponse.json({ ok: true });
}

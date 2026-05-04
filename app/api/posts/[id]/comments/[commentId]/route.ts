import { NextResponse } from "next/server";
import { ensureSchema, updateComment } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  await ensureSchema();
  const { commentId } = await params;
  const raw = (await req.json().catch(() => null)) as { body?: string } | null;
  if (!raw || typeof raw.body !== "string" || !raw.body.trim()) {
    return NextResponse.json({ error: "Body required." }, { status: 400 });
  }
  await updateComment(commentId, raw.body.trim());
  return NextResponse.json({ ok: true });
}

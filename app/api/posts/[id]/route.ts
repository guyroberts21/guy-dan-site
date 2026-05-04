import { NextResponse } from "next/server";
import { ensureSchema, updatePost } from "@/lib/db";
import type { Post } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema();
  const { id } = await params;
  const raw = (await req.json().catch(() => null)) as Partial<Post> | null;
  if (!raw) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  await updatePost(id, {
    body: raw.body?.trim() || undefined,
    attribution: raw.attribution?.trim() || undefined,
    title: raw.title?.trim() || undefined,
    url: raw.url?.trim() || undefined,
    excerpt: raw.excerpt?.trim() || undefined,
    source: raw.source?.trim() || undefined,
  });
  return NextResponse.json({ ok: true });
}

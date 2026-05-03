import { NextResponse } from "next/server";
import { ensureSchema, insertComment } from "@/lib/db";
import type { Author, Comment } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema();
  const { id: postId } = await params;
  const raw = (await req.json().catch(() => null)) as Partial<Comment> | null;
  if (!raw || typeof raw.body !== "string" || !raw.body.trim()) {
    return NextResponse.json({ error: "Body required." }, { status: 400 });
  }
  const author = raw.author as Author;
  if (author !== "guy" && author !== "dan") {
    return NextResponse.json({ error: "Invalid author" }, { status: 400 });
  }
  const c: Comment = {
    id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    author,
    time: new Date().toISOString(),
    body: raw.body.trim(),
  };
  try {
    await insertComment(postId, c);
  } catch {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ comment: c });
}

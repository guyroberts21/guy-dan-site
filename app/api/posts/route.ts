import { NextResponse } from "next/server";
import { ensureSchema, insertPost, listPosts } from "@/lib/db";
import type { Author, Post, PostType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const posts = await listPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  await ensureSchema();
  const raw = (await req.json().catch(() => null)) as Partial<Post> | null;
  if (!raw) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const author = raw.author as Author;
  const type = raw.type as PostType;
  if (author !== "guy" && author !== "dan") {
    return NextResponse.json({ error: "Invalid author" }, { status: 400 });
  }
  if (type !== "text" && type !== "quote" && type !== "link") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (type === "link" && (!raw.title?.trim() || !raw.url?.trim())) {
    return NextResponse.json({ error: "Link posts need a title and url." }, { status: 400 });
  }
  if ((type === "text" || type === "quote") && !raw.body?.trim()) {
    return NextResponse.json({ error: "Body required." }, { status: 400 });
  }

  const post: Post = {
    id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    author,
    type,
    time: new Date().toISOString(),
    body: raw.body?.trim() || undefined,
    attribution: raw.attribution?.trim() || undefined,
    title: raw.title?.trim() || undefined,
    url: raw.url?.trim() || undefined,
    excerpt: raw.excerpt?.trim() || undefined,
    source: raw.source?.trim() || undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string").slice(0, 12) : [],
    comments: [],
  };
  await insertPost(post);
  return NextResponse.json({ post });
}

import { NextResponse } from "next/server";
import { ensureSchema, getChallenge, setChallenge } from "@/lib/db";
import type { Author, Challenge } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const challenge = await getChallenge();
  return NextResponse.json({ challenge });
}

export async function PUT(req: Request) {
  await ensureSchema();
  const raw = (await req.json().catch(() => null)) as Partial<Challenge> | null;
  if (!raw) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const setBy = raw.setBy as Author;
  if (setBy !== "guy" && setBy !== "dan") {
    return NextResponse.json({ error: "Invalid setBy" }, { status: 400 });
  }
  if (!raw.title?.trim() || !raw.body?.trim() || !raw.started || !raw.ends) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const c: Challenge = {
    title: raw.title.trim(),
    body: raw.body.trim(),
    started: raw.started,
    ends: raw.ends,
    setBy,
  };
  await setChallenge(c);
  return NextResponse.json({ challenge: c });
}

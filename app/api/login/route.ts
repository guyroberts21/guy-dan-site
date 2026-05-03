import { NextResponse } from "next/server";
import { COOKIE_NAME, makeToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.SITE_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!expected || !secret) {
    return NextResponse.json({ error: "Server is missing SITE_PASSWORD or SESSION_SECRET." }, { status: 500 });
  }
  if (!password || password !== expected) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const token = await makeToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}

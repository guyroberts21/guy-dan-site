import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.next();
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = await verifyToken(secret, token);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api/login|_next/static|_next/image|favicon.ico).*)",
  ],
};

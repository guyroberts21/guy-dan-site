export const COOKIE_NAME = "gd_auth";

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function makeToken(secret: string): Promise<string> {
  const msg = "ok." + Date.now();
  const sig = await hmac(secret, msg);
  return msg + "." + sig;
}

export async function verifyToken(
  secret: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const msg = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!msg.startsWith("ok.")) return false;
  const expected = await hmac(secret, msg);
  return timingSafeEqual(sig, expected);
}

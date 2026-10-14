// ============================================================
// NOVA — Authentication (scrypt hashing, JWT sessions, guards)
// ============================================================
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { hashPassword, verifyPassword } from "./password.mjs";
import { collections } from "./mongo";
import { HttpError } from "./http";
import type { UserDoc } from "./doc-types";

export { hashPassword, verifyPassword, HttpError };

export const AUTH_COOKIE = "nova_token";
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const SECRET =
  process.env.NOVA_SECRET || "nova-dev-secret-do-not-use-in-production";

export interface JwtPayload {
  uid: string;
  role: string;
  exp: number;
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

/** Sign a compact HMAC-SHA256 JWT for the given user. */
export function signToken(uid: string, role: string): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      uid,
      role,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }),
  );
  const signature = createHmac("sha256", SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

/** Verify signature + expiry. Returns the payload or null. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = createHmac("sha256", SECRET)
      .update(`${header}.${payload}`)
      .digest();
    const given = Buffer.from(signature, "base64url");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return null;
    }
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<JwtPayload>;
    if (typeof data.uid !== "string") return null;
    if (typeof data.exp !== "number") return null;
    if (data.exp * 1000 < Date.now()) return null;
    return {
      uid: data.uid,
      role: typeof data.role === "string" ? data.role : "user",
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
};

/** Attach the session cookie to an outgoing NextResponse. */
export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
  return res;
}

/** Clear the session cookie. */
export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/**
 * Resolve the logged-in user from the `nova_token` httpOnly cookie.
 * `cookies()` is async in Next.js 16 — always await it.
 */
export async function getSessionUser(): Promise<UserDoc | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !ObjectId.isValid(payload.uid)) return null;
  const { users } = await collections();
  const user = await users.findOne({ _id: new ObjectId(payload.uid) });
  return user ?? null;
}

/** Require a logged-in, non-banned user — throws 401/403 HttpError otherwise. */
export async function requireUser(): Promise<UserDoc> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Authentication required");
  if (user.banned) throw new HttpError(403, "Your account has been banned");
  return user;
}

/** Require an admin — throws 401 (no session) or 403 (not admin). */
export async function requireAdmin(): Promise<UserDoc> {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
  return user;
}

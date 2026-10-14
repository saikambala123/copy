// Password hashing for NOVA — plain ESM (node:crypto) so it can be imported
// BOTH by the Next.js server (src/lib/auth.ts) and the plain-node seed script
// (scripts/seed.mjs -> src/lib/seed.ts). Single source of truth.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/** Hash a password with scrypt + per-user random salt. Format: `scrypt:<salt>:<hash>` */
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/** Constant-time verification of a password against a stored `scrypt:salt:hash` string. */
export function verifyPassword(password, stored) {
  try {
    const parts = String(stored ?? "").split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const [, salt, hex] = parts;
    const expected = Buffer.from(hex, "hex");
    const given = scryptSync(String(password), salt, expected.length);
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

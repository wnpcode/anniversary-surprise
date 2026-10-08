import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ARCHIVE_COOKIE = "anniversary_archive_session";
export const ARCHIVE_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("ARCHIVE_SESSION_SECRET must contain at least 32 bytes.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createArchiveSession() {
  const payload = `v1.${Math.floor(Date.now() / 1000) + ARCHIVE_SESSION_MAX_AGE}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidArchiveSession(session: string | undefined) {
  if (!session) return false;

  const [version, expiresAt, signature, ...extra] = session.split(".");
  if (version !== "v1" || !expiresAt || !signature || extra.length > 0) return false;

  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(Date.now() / 1000)) return false;

  try {
    const expected = Buffer.from(sign(`${version}.${expiresAt}`), "base64url");
    const actual = Buffer.from(signature, "base64url");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

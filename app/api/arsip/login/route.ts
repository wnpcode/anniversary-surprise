import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ARCHIVE_COOKIE, ARCHIVE_SESSION_MAX_AGE, createArchiveSession } from "@/lib/archive-auth";

export const runtime = "nodejs";

const ALLOWED_DESTINATIONS = ["/arsip", "/remote", "/layar"];

function matchesSecret(input: string, expected: string) {
  const inputDigest = createHash("sha256").update(input).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputDigest, expectedDigest);
}

function safeArchiveDestination(value: FormDataEntryValue | null, request: NextRequest) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/arsip/";

  const destination = new URL(value, request.url);
  const isAllowedPath = ALLOWED_DESTINATIONS.some((base) => destination.pathname === base || destination.pathname.startsWith(`${base}/`));
  if (destination.origin !== request.nextUrl.origin || !isAllowedPath) return "/arsip/";

  return `${destination.pathname}${destination.search}`;
}

export async function POST(request: NextRequest) {
  const username = process.env.ARCHIVE_USERNAME;
  const password = process.env.ARCHIVE_PASSWORD;
  const sessionSecret = process.env.ARCHIVE_SESSION_SECRET;

  if (!username || !password || !sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    const setupUrl = new URL("/masuk/?error=setup", request.url);
    return NextResponse.redirect(setupUrl, 303);
  }

  const formData = await request.formData();
  const submittedUsername = formData.get("username");
  const submittedPassword = formData.get("password");
  const destination = safeArchiveDestination(formData.get("next"), request);
  let isValid = false;
  if (
    typeof submittedUsername === "string" &&
    typeof submittedPassword === "string" &&
    submittedUsername.length <= 256 &&
    submittedPassword.length <= 1024
  ) {
    isValid = matchesSecret(submittedUsername, username) && matchesSecret(submittedPassword, password);
  }

  if (!isValid) {
    const loginUrl = new URL("/masuk/", request.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("next", destination);
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(ARCHIVE_COOKIE, createArchiveSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ARCHIVE_SESSION_MAX_AGE,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

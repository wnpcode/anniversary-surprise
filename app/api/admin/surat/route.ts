import { NextRequest, NextResponse } from "next/server";
import { ARCHIVE_COOKIE, isValidArchiveSession } from "@/lib/archive-auth";
import { updateAnniversaryLetter } from "@/lib/anniversaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
const MAX_LETTER_LENGTH = 5000;
const MAX_SIGNOFF_LENGTH = 120;

function redirectTo(path: string, request: NextRequest) {
  const response = NextResponse.redirect(new URL(path, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

export async function POST(request: NextRequest) {
  if (!isValidArchiveSession(request.cookies.get(ARCHIVE_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const formData = await request.formData();
  const slug = formData.get("slug");
  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    return redirectTo("/admin/", request);
  }

  const editionPath = `/admin/${slug}/`;
  const letter = normalizeText(formData.get("letter"));
  const signoff = normalizeText(formData.get("signoff"));

  if (!letter || !signoff) return redirectTo(`${editionPath}?error=empty`, request);
  if (letter.length > MAX_LETTER_LENGTH || signoff.length > MAX_SIGNOFF_LENGTH) {
    return redirectTo(`${editionPath}?error=long`, request);
  }

  try {
    const matched = await updateAnniversaryLetter(slug, { letter, signoff });
    if (matched === 0) return redirectTo(`${editionPath}?error=notfound`, request);
  } catch (error) {
    console.error("Failed to update anniversary letter", error);
    return redirectTo(`${editionPath}?error=unavailable`, request);
  }

  return redirectTo(`${editionPath}?saved=1`, request);
}

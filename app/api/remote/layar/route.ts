import { NextResponse, type NextRequest } from "next/server";
import { ARCHIVE_COOKIE, isValidArchiveSession } from "@/lib/archive-auth";
import { syncScreen } from "@/lib/remote-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PATH_LENGTH = 200;
const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  if (!isValidArchiveSession(request.cookies.get(ARCHIVE_COOKIE)?.value)) return json({ error: "unauthorized" }, 401);

  const body: unknown = await request.json().catch(() => null);
  const input = typeof body === "object" && body !== null ? (body as { since?: unknown; path?: unknown }) : {};
  const path = typeof input.path === "string" && input.path.startsWith("/") && input.path.length <= MAX_PATH_LENGTH ? input.path : "/";
  const since = typeof input.since === "number" && Number.isSafeInteger(input.since) ? input.since : null;

  try {
    const state = await syncScreen(path);
    const seq = state?.seq ?? 0;
    const commands = since === null
      ? []
      : (state?.commands ?? [])
          .filter((entry) => entry.seq > since)
          .sort((a, b) => a.seq - b.seq)
          .map(({ seq: commandSeq, command }) => ({ seq: commandSeq, command }));
    return json({ seq, commands });
  } catch (error) {
    console.error("Remote screen sync failed", error);
    return json({ error: "remote-unavailable" }, 503);
  }
}

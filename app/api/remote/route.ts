import { NextResponse, type NextRequest } from "next/server";
import { ARCHIVE_COOKIE, isValidArchiveSession } from "@/lib/archive-auth";
import { isRemoteCommand } from "@/lib/remote";
import { pushCommand, readRemoteState } from "@/lib/remote-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function isAuthorized(request: NextRequest) {
  return isValidArchiveSession(request.cookies.get(ARCHIVE_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return json({ error: "unauthorized" }, 401);

  try {
    const state = await readRemoteState();
    const last = state?.commands.at(-1);
    return json({
      seq: state?.seq ?? 0,
      now: new Date().toISOString(),
      screen: state?.screen ? { seenAt: state.screen.seenAt.toISOString(), path: state.screen.path } : null,
      last: last ? { command: last.command, sentAt: last.sentAt.toISOString() } : null,
    });
  } catch (error) {
    console.error("Remote status failed", error);
    return json({ error: "remote-unavailable" }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return json({ error: "unauthorized" }, 401);

  const body: unknown = await request.json().catch(() => null);
  const command = typeof body === "object" && body !== null ? (body as { command?: unknown }).command : undefined;
  if (typeof command !== "string" || !isRemoteCommand(command)) return json({ error: "invalid-command" }, 400);

  try {
    return json({ seq: await pushCommand(command) });
  } catch (error) {
    console.error("Remote command failed", error);
    return json({ error: "remote-unavailable" }, 503);
  }
}

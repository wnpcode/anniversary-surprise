import { NextResponse, type NextRequest } from "next/server";
import { ARCHIVE_COOKIE, isValidArchiveSession } from "@/lib/archive-auth";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(ARCHIVE_COOKIE)?.value;
  if (isValidArchiveSession(session)) return NextResponse.next();

  const loginUrl = new URL("/masuk/", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/arsip/:path*", "/remote/:path*", "/layar/:path*"],
};

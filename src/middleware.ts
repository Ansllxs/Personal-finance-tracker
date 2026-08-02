import { NextResponse, type NextRequest } from "next/server";

/** Sin login: cualquier visita a auth va al dashboard. */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/login") ||
    path.startsWith("/registro") ||
    path.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

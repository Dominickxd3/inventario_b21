import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESION_COOKIE = "b21-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sesion = request.cookies.get(SESION_COOKIE)?.value;

  const esLogin = pathname === "/login";
  const estaEnRutaProtegida = !esLogin && pathname !== "/_next" && !pathname.startsWith("/_next") && !pathname.startsWith("/favicon") && !pathname.startsWith("/isotipo");

  if (estaEnRutaProtegida && !sesion) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (esLogin && sesion) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|isotipo.svg|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)"],
};

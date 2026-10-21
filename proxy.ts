// Puerta del demo: sin cookie de sesión válida, toda página manda a /login.
// Con sesión, cada perfil solo abre sus pantallas; si pide otra, va a su inicio.
// Se llama proxy.ts (no middleware.ts) porque así lo pide Next 16.

import { NextResponse, type NextRequest } from "next/server";
import { puedeVer, ROL_INFO } from "@/lib/roles";
import { COOKIE, rolDeSesion } from "@/lib/session";

const PUBLICAS = ["/login", "/api/login", "/api/logout"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLICAS.includes(pathname)) return NextResponse.next();
  const rol = await rolDeSesion(req.cookies.get(COOKIE)?.value);
  if (rol) {
    if (pathname.startsWith("/api/") || puedeVer(rol, pathname)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = rol === "general" ? "/" : ROL_INFO[rol].inicio;
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|brand/|favicon.ico).*)"],
};

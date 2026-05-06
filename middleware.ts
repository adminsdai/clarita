import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/dashboard", "/solicitudes"];
const PROTECTED_API_PREFIXES = ["/api/solicitudes", "/api/adjuntos"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPage = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isPage && !isApi) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const headers = new Headers(request.headers);
  headers.set("x-user-id", session.sub);
  headers.set("x-user-email", session.email);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/dashboard/:path*", "/solicitudes/:path*", "/api/solicitudes/:path*", "/api/adjuntos/:path*"],
};

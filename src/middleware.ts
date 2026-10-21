import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Fast, cookie-level gate. Real authorization is re-checked on the server in requireUser().
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("flipflip_session")?.value;
  const secret = process.env.AUTH_SECRET;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      /* fall through to redirect */
    }
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/dashboard/:path*", "/decks/:path*", "/practice/:path*", "/onboarding"] };

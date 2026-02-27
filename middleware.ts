import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";

const ROLE_RANK: Record<SessionPayload["role"], number> = {
  admin: 4,
  superuser: 3,
  user: 2,
  kiosk: 1,
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
}

async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const session = await getSessionFromRequest(req);
  const rank = session ? ROLE_RANK[session.role] : 0;

  // /admin → superuser eller admin
  if (pathname.startsWith("/admin")) {
    if (rank < ROLE_RANK.superuser) {
      return NextResponse.redirect(
        new URL(session ? "/login?unauthorized=1" : "/login", req.url)
      );
    }
  }

  // /staff → user, superuser, admin
  if (pathname.startsWith("/staff")) {
    if (rank < ROLE_RANK.user) {
      return NextResponse.redirect(
        new URL(session ? "/login?unauthorized=1" : "/login", req.url)
      );
    }
    // Kiosk-roll ska inte kunna besöka /staff
    if (session?.role === "kiosk") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // / (kiosk-vy) kräver inloggning
  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // user/superuser/admin som besöker / skickas till /staff
    if (rank >= ROLE_RANK.user) {
      return NextResponse.redirect(new URL("/staff", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matcha allt utom statiska filer, /login och /queue (publika)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|queue).*)",
  ],
};

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "kapp_session";
const SESSION_DURATION_DAYS = 7;

export type SessionPayload = {
  id: string;
  username: string;
  display_name: string;
  role: "admin" | "superuser" | "user" | "kiosk";
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env saknas");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

export const ROLE_RANK: Record<SessionPayload["role"], number> = {
  admin: 4,
  superuser: 3,
  user: 2,
  kiosk: 1,
};

/** Kontrollerar om roll har minst den rankade behörigheten */
export function hasRole(
  session: SessionPayload | null,
  minRole: SessionPayload["role"]
): boolean {
  if (!session) return false;
  return ROLE_RANK[session.role] >= ROLE_RANK[minRole];
}

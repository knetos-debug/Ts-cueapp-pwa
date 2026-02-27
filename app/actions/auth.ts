"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  signSession,
  getSession,
  hasRole,
  SESSION_COOKIE,
  type SessionPayload,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

type AppUser = {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: SessionPayload["role"];
  active: boolean;
  failed_attempts: number;
  locked_until: string | null;
  visible_password: string | null;
};

// ---------------------------------------------------------------------------
// Valideringshälpare
// ---------------------------------------------------------------------------
function validateUsername(u: string): string | null {
  const s = u.trim().toLowerCase();
  if (s.length < 3) return "Användarnamnet måste vara minst 3 tecken.";
  if (s.length > 30) return "Användarnamnet får vara max 30 tecken.";
  if (!/^[a-z0-9_-]+$/.test(s)) return "Användarnamnet får bara innehålla bokstäver, siffror, _ och -.";
  return null;
}

function validateDisplayName(n: string): string | null {
  const s = n.trim();
  if (s.length < 2) return "Visningsnamnet måste vara minst 2 tecken.";
  if (s.length > 50) return "Visningsnamnet får vara max 50 tecken.";
  return null;
}

function validatePassword(p: string): string | null {
  if (p.length < 8) return "Lösenordet måste vara minst 8 tecken.";
  if (p.length > 100) return "Lösenordet är för långt.";
  return null;
}

// ---------------------------------------------------------------------------
// LOGIN — med rate limiting via DB
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 10;        // Max misslyckade försök
const LOCK_MINUTES = 15;        // Låstid i minuter

export async function loginAction(
  username: string,
  password: string
): Promise<{ error?: string }> {
  // Grundvalidering för att slippa onödiga DB-anrop
  if (!username || !password) return { error: "Fyll i användarnamn och lösenord." };
  if (username.length > 100 || password.length > 200) {
    return { error: "Fel användarnamn eller lösenord." };
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, password_hash, display_name, role, active, failed_attempts, locked_until")
    .ilike("username", username.trim())
    .single<AppUser>();

  // Samma felmeddelande oavsett om användaren finns eller ej
  if (error || !data) return { error: "Fel användarnamn eller lösenord." };
  if (!data.active) return { error: "Kontot är inaktivt. Kontakta administratören." };

  // Kontrollera om kontot är tillfälligt låst
  if (data.locked_until && new Date(data.locked_until) > new Date()) {
    const minLeft = Math.ceil(
      (new Date(data.locked_until).getTime() - Date.now()) / 60000
    );
    return { error: `För många misslyckade försök. Försök igen om ${minLeft} min.` };
  }

  const ok = await verifyPassword(password, data.password_hash);

  if (!ok) {
    // Räkna upp misslyckade försök
    const newAttempts = (data.failed_attempts ?? 0) + 1;
    const updates: Record<string, unknown> = { failed_attempts: newAttempts };

    if (newAttempts >= MAX_ATTEMPTS) {
      updates.locked_until = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
      updates.failed_attempts = 0;
    }

    await supabase.from("app_users").update(updates).eq("id", data.id);
    return { error: "Fel användarnamn eller lösenord." };
  }

  // Lyckad inloggning — nollställ räknaren
  await supabase
    .from("app_users")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("id", data.id);

  const token = await signSession({
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    role: data.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(data.role === "kiosk" ? "/" : "/staff");
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}

// ---------------------------------------------------------------------------
// SKAPA ANVÄNDARE
// ---------------------------------------------------------------------------
type CreateUserInput = {
  username: string;
  password: string;
  display_name: string;
  role: SessionPayload["role"];
};

export async function createUserAction(
  input: CreateUserInput
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!hasRole(session, "superuser")) return { error: "Ej behörig." };

  const usernameErr = validateUsername(input.username);
  if (usernameErr) return { error: usernameErr };

  const displayErr = validateDisplayName(input.display_name);
  if (displayErr) return { error: displayErr };

  const pwErr = validatePassword(input.password);
  if (pwErr) return { error: pwErr };

  // Kan bara skapa roller med lägre rank (superuser kan inte skapa admin)
  const RANK = { admin: 4, superuser: 3, user: 2, kiosk: 1 };
  const creatorRank = RANK[session!.role];
  const targetRank = RANK[input.role];
  if (targetRank >= creatorRank) {
    return { error: "Du kan inte skapa en användare med lika hög eller högre roll." };
  }

  const password_hash = await hashPassword(input.password);
  const visible_password = input.role === "kiosk" ? input.password : null;

  const { error } = await supabase.from("app_users").insert({
    username: input.username.trim().toLowerCase(),
    password_hash,
    display_name: input.display_name.trim(),
    role: input.role,
    visible_password,
    created_by: session!.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Användarnamnet är redan taget." };
    return { error: "Kunde inte skapa användaren. Försök igen." };
  }

  return {};
}

// ---------------------------------------------------------------------------
// BYT EGET LÖSENORD (alla inloggade)
// ---------------------------------------------------------------------------
export async function changeOwnPasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Inte inloggad." };

  const pwErr = validatePassword(newPassword);
  if (pwErr) return { error: pwErr };

  const { data } = await supabase
    .from("app_users")
    .select("password_hash")
    .eq("id", session.id)
    .single<{ password_hash: string }>();

  if (!data) return { error: "Användaren hittades inte." };

  const ok = await verifyPassword(currentPassword, data.password_hash);
  if (!ok) return { error: "Nuvarande lösenord stämmer inte." };

  const password_hash = await hashPassword(newPassword);
  const { error } = await supabase
    .from("app_users")
    .update({ password_hash })
    .eq("id", session.id);

  if (error) return { error: "Kunde inte spara lösenordet. Försök igen." };
  return {};
}

// ---------------------------------------------------------------------------
// UPPDATERA ANVÄNDARE — kräver superuser+
// ---------------------------------------------------------------------------
type UpdateUserInput = {
  id: string;
  display_name?: string;
  new_password?: string;
  active?: boolean;
};

export async function updateUserAction(
  input: UpdateUserInput
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!hasRole(session, "superuser")) return { error: "Ej behörig." };

  const { data: target } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", input.id)
    .single<{ role: SessionPayload["role"] }>();

  if (!target) return { error: "Användaren hittades inte." };

  const RANK = { admin: 4, superuser: 3, user: 2, kiosk: 1 };
  const sessionRank = RANK[session!.role];
  const targetRank = RANK[target.role];
  const isSelf = input.id === session!.id;

  if (!isSelf && targetRank >= sessionRank) {
    return { error: "Ej behörig att redigera denna användare." };
  }

  if (input.display_name !== undefined) {
    const err = validateDisplayName(input.display_name);
    if (err) return { error: err };
  }
  if (input.new_password) {
    const err = validatePassword(input.new_password);
    if (err) return { error: err };
  }

  const updates: Record<string, unknown> = {};
  if (input.display_name !== undefined) updates.display_name = input.display_name.trim();
  if (input.active !== undefined && !isSelf) updates.active = input.active;
  if (input.new_password) {
    updates.password_hash = await hashPassword(input.new_password);
    if (target.role === "kiosk") updates.visible_password = input.new_password;
  }

  const { error } = await supabase
    .from("app_users")
    .update(updates)
    .eq("id", input.id);

  if (error) return { error: "Kunde inte uppdatera användaren. Försök igen." };
  return {};
}

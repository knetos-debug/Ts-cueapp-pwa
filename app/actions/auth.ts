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
  visible_password: string | null;
};

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export async function loginAction(
  username: string,
  password: string
): Promise<{ error?: string }> {
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, password_hash, display_name, role, active")
    .ilike("username", username.trim())
    .single<AppUser>();

  if (error || !data) return { error: "Fel användarnamn eller lösenord." };
  if (!data.active) return { error: "Kontot är inaktivt." };

  const ok = await verifyPassword(password, data.password_hash);
  if (!ok) return { error: "Fel användarnamn eller lösenord." };

  const token = await signSession({
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    role: data.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dagar
    secure: process.env.NODE_ENV === "production",
  });

  // Redirect baserat på roll
  const dest =
    data.role === "kiosk"
      ? "/"  // kiosk-enheten hamnar alltid på startsidan (kiosk-vyn)
      : data.role === "admin" || data.role === "superuser" || data.role === "user"
      ? "/staff"
      : "/staff";

  redirect(dest);
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
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

  // Kan bara skapa roller med lägre rank än sig själv (superuser kan inte skapa admin)
  const creatorRank = session!.role === "admin" ? 4 : 3;
  const targetRank = { admin: 4, superuser: 3, user: 2, kiosk: 1 }[input.role];
  if (targetRank >= creatorRank && session!.role !== "admin") {
    return { error: "Du kan inte skapa en användare med högre eller samma roll." };
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
    return { error: "Kunde inte skapa användaren." };
  }

  return {};
}

// ---------------------------------------------------------------------------
// BYT EGET LÖSENORD (alla inloggade användare)
// ---------------------------------------------------------------------------
export async function changeOwnPasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Inte inloggad." };

  const { data } = await supabase
    .from("app_users")
    .select("password_hash")
    .eq("id", session.id)
    .single<{ password_hash: string }>();

  if (!data) return { error: "Användaren hittades inte." };

  const ok = await verifyPassword(currentPassword, data.password_hash);
  if (!ok) return { error: "Nuvarande lösenord stämmer inte." };

  if (newPassword.length < 6) return { error: "Nytt lösenord måste vara minst 6 tecken." };

  const password_hash = await hashPassword(newPassword);
  const { error } = await supabase
    .from("app_users")
    .update({ password_hash })
    .eq("id", session.id);

  if (error) return { error: "Kunde inte spara lösenordet." };
  return {};
}

// ---------------------------------------------------------------------------
// UPPDATERA ANVÄNDARE (lösenord, namn, aktiv-status) — kräver superuser+
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

  // Hämta målanvändaren
  const { data: target } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", input.id)
    .single<{ role: SessionPayload["role"] }>();

  if (!target) return { error: "Användaren hittades inte." };

  const RANK = { admin: 4, superuser: 3, user: 2, kiosk: 1 };
  const sessionRank = RANK[session!.role];
  const targetRank = RANK[target.role];

  // Egna kontot kan alltid redigeras (byt namn/lösenord)
  const isSelf = input.id === session!.id;
  if (!isSelf && targetRank >= sessionRank) {
    return { error: "Ej behörig att redigera denna användare." };
  }

  const updates: Record<string, unknown> = {};
  if (input.display_name !== undefined) updates.display_name = input.display_name.trim();
  // Aktiv-status kan inte ändras på det egna kontot
  if (input.active !== undefined && !isSelf) updates.active = input.active;
  if (input.new_password) {
    updates.password_hash = await hashPassword(input.new_password);
    if (target.role === "kiosk") updates.visible_password = input.new_password;
  }

  const { error } = await supabase
    .from("app_users")
    .update(updates)
    .eq("id", input.id);

  if (error) return { error: "Kunde inte uppdatera användaren." };
  return {};
}

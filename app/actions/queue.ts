"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const adminSecret = process.env.ADMIN_SECRET ?? "";
const kioskSecret = process.env.KIOSK_SECRET ?? "";

/** Hjälp: service role-klient (kringgår RLS) */
function adminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Lägg till i kö via kiosk-surfplatta.
 * Kräver att kiosk_secret matchar env-variabeln KIOSK_SECRET.
 */
export async function joinQueue(
  user_id: string,
  category: string,
  kiosk_secret: string
): Promise<{ error?: string }> {
  if (!kioskSecret) {
    return { error: "KIOSK_SECRET är inte konfigurerad på servern." };
  }
  if (kiosk_secret !== kioskSecret) {
    return { error: "Ej behörig. Kontrollera kiosk-URL:en." };
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: "Supabase är inte konfigurerad." };
  }

  const { error } = await adminClient()
    .from("queue")
    .insert({ user_id, category, status: "waiting" });

  return error ? { error: error.message } : {};
}

/**
 * Radera köpost.
 * Försök 1: adminInput matchar ADMIN_SECRET → service role (backward compat / kiosk-QR).
 * Försök 2: adminInput är tomt → verifiera inloggad staff-session → delete via RLS.
 */
export async function deleteQueueEntry(
  id: string,
  adminInput: string
): Promise<{ error?: string }> {
  // ── Försök 1: ADMIN_SECRET (kvar som fallback för kiosk-admin-QR) ──────────
  if (adminSecret && adminInput.trim() === adminSecret) {
    if (!supabaseUrl || !supabaseServiceKey) {
      return { error: "Supabase är inte konfigurerad." };
    }
    const { error } = await adminClient().from("queue").delete().eq("id", id);
    return error ? { error: error.message } : {};
  }

  // ── Försök 2: Inloggad personal (Supabase Auth session) ───────────────────
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: staffMember } = await supabase
        .from("staff")
        .select("id")
        .eq("id", user.id)
        .single();

      if (staffMember) {
        const { error } = await supabase
          .from("queue")
          .delete()
          .eq("id", id);
        return error ? { error: error.message } : {};
      }
    }
  } catch {
    // Session ej tillgänglig i denna kontext
  }

  return { error: "Fel lösenord eller ogiltig QR." };
}

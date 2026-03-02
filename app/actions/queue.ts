"use server";

import { createClient } from "@supabase/supabase-js";
import { getSession, hasRole } from "@/lib/auth/session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function adminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Lägg till i kö — kräver inloggad kiosk/superuser/admin-session.
 */
export async function joinQueue(
  user_id: string,
  category: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!hasRole(session, "kiosk")) {
    return { error: "Ej behörig. Logga in som kiosk." };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: "Supabase är inte konfigurerad." };
  }

  const { error } = await adminClient()
    .from("queue")
    .insert({ user_id, category, status: "waiting" });

  if (error) {
    if (error.code === "23505") return { error: "Den här personen står redan i kön." };
    return { error: "Åtgärden misslyckades. Försök igen." };
  }
  return {};
}

/**
 * Radera köpost — kräver inloggad user/superuser/admin-session.
 */
export async function deleteQueueEntry(
  id: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!hasRole(session, "user")) {
    return { error: "Ej behörig." };
  }

  const { error } = await adminClient().from("queue").delete().eq("id", id);
  return error ? { error: "Åtgärden misslyckades. Försök igen." } : {};
}

/**
 * Uppdatera status på en köpost — kräver user/superuser/admin-session.
 * served_by sätts när status → in_progress, rensas när status → done.
 */
export async function updateQueueStatus(
  id: string,
  status: "in_progress" | "done",
  served_by?: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!hasRole(session, "user")) {
    return { error: "Inte inloggad." };
  }

  const updates: Record<string, unknown> = { status };
  if (status === "in_progress" && served_by) updates.served_by = served_by;
  if (status === "done") updates.served_by = null;

  const { error } = await adminClient()
    .from("queue")
    .update(updates)
    .eq("id", id);

  return error ? { error: "Åtgärden misslyckades. Försök igen." } : {};
}

/**
 * Uppdatera status på en maskin/station — kräver user/superuser/admin-session.
 */
export async function updateStationStatus(
  id: string,
  status: "available" | "maintenance"
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!hasRole(session, "user")) {
    return { error: "Inte inloggad." };
  }

  const { error } = await adminClient()
    .from("stations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  return error ? { error: "Åtgärden misslyckades. Försök igen." } : {};
}

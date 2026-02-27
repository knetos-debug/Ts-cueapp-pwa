"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const adminSecret = process.env.ADMIN_SECRET ?? "";

export async function deleteQueueEntry(
  id: string,
  adminInput: string
): Promise<{ error?: string }> {
  if (!adminSecret) {
    return { error: "Admin är inte konfigurerad." };
  }
  if (adminInput.trim() !== adminSecret) {
    return { error: "Fel lösenord eller ogiltig QR." };
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: "Supabase är inte konfigurerad." };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { error } = await supabase.from("queue").delete().eq("id", id);

  if (error) return { error: error.message };
  return {};
}

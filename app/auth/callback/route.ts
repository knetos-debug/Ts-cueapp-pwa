import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Hanterar magic link-redirect från Supabase.
 * URL: /auth/callback?code=<PKCE-kod>
 * Byt kod mot session → redirect till /staff.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/staff";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Något gick fel — skicka tillbaka till login med felmeddelande
  return NextResponse.redirect(`${origin}/staff/login?error=auth`);
}

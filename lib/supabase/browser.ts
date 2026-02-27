import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client med cookie-baserad session.
 * Använd i Client Components som behöver auth (login, logout).
 * Kompatibel med server.ts — båda använder cookies, inte localStorage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

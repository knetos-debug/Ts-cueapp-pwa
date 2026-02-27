import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth-guard för /staff/* routes.
 * Kräver giltig Supabase Auth-session OCH att user finns i staff-tabellen.
 * Undantag: /staff/login är alltid tillgänglig.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Hämta inloggad user — refreshar session-token om det behövs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/staff/login";

  // Inte inloggad → till login
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  // Inloggad men inte i staff-tabellen → unauthorized
  if (user && !isLoginPage) {
    const { data: staffMember } = await supabase
      .from("staff")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!staffMember) {
      return NextResponse.redirect(
        new URL("/staff/login?unauthorized=1", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/staff/:path*"],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Comma-separated list of allowed emails (invite-only mode). When set, only these users can access the app. */
function getAllowedEmails(): Set<string> {
  const raw = process.env.ALLOWED_EMAILS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
}

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

  // Refresh session — must await to keep session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Invite-only gate: when ALLOWED_EMAILS is set, only listed emails can access the app ---
  const allowedEmails = getAllowedEmails();
  const pathname = request.nextUrl.pathname;
  const isInviteOnlyPath = pathname === "/invite-only" || pathname.startsWith("/auth/");
  if (allowedEmails.size > 0 && !isInviteOnlyPath) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/invite-only";
      url.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
    const email = user.email?.trim().toLowerCase();
    if (!email || !allowedEmails.has(email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/invite-only";
      url.searchParams.set("reason", "not_invited");
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin routes — redirect to home if not authenticated
  // (role check happens inside the admin route itself for granular control)
  if (pathname.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Protect /profile route — redirect to home if not authenticated
  if (pathname.startsWith("/profile") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     * - api/og (OG image generation — no auth needed)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

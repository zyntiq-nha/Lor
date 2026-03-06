import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LOGIN_PATH = "/login";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  type CookieSetOptions = Parameters<typeof response.cookies.set>[2];
  type CookieToSet = {
    name: string;
    value: string;
    options?: CookieSetOptions;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");

  let isAdmin = false;
  if (user) {
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!adminRecord;
  }

  if (isAdminRoute && !isAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
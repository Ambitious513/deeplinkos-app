import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import { hasSupabaseEnv } from "@/lib/env";

const APP_HOSTS = new Set(["deeplinkos.com", "www.deeplinkos.com", "localhost", "127.0.0.1"]);

function isAppHost(hostname: string) {
  return APP_HOSTS.has(hostname) || hostname.endsWith(".deeplinkos.com");
}

function isRootLevelCustomDomainSlug(pathname: string) {
  return pathname !== "/" && !pathname.startsWith("/_next") && !pathname.startsWith("/api") && !pathname.slice(1).includes("/");
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  if (hostname && !isAppHost(hostname) && isRootLevelCustomDomainSlug(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/r/${request.nextUrl.pathname.replace(/^\//, "")}`;
    return NextResponse.rewrite(url);
  }

  if (!hasSupabaseEnv()) {
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/onboarding");

  if (protectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("auth", "login");
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type AuthProfile = Database["public"]["Tables"]["profiles"]["Row"];

export type AuthState = {
  user: {
    id: string;
    email: string | null;
  } | null;
  profile: AuthProfile | null;
  configured: boolean;
};

export function isProfileComplete(profile: AuthProfile | null) {
  return Boolean(profile?.first_name && profile?.last_name && profile?.onboarding_completed_at);
}

export function displayName(profile: AuthProfile | null, email?: string | null) {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return name || email?.split("@")[0] || "Workspace";
}

export async function getAuthState(): Promise<AuthState> {
  if (!hasSupabaseEnv()) {
    return { user: null, profile: null, configured: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, configured: true };
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile,
    configured: true,
  };
}

export async function requireAuth(next = "/dashboard") {
  const state = await getAuthState();

  if (!state.configured) {
    return state;
  }

  if (!state.user) {
    redirect(`/?auth=login&next=${encodeURIComponent(next)}`);
  }

  return state;
}

export async function requireOnboarded(next = "/dashboard") {
  const state = await requireAuth(next);

  if (state.configured && state.user && !isProfileComplete(state.profile)) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  return state;
}

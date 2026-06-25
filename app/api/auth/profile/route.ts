import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured yet.", 503);
  }

  const body = await request.json().catch(() => null);
  const firstName = String(body?.first_name || "").trim();
  const lastName = String(body?.last_name || "").trim();

  if (!firstName || !lastName) {
    return jsonError("First and last name are required.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Sign in again to finish onboarding.", 401);
  }

  const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const workspaceName = existingProfile?.workspace_name || `${firstName}'s workspace`;
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : existingProfile?.avatar_url;
  const now = new Date().toISOString();

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email || existingProfile?.email || "",
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl ?? null,
      workspace_name: workspaceName,
      onboarding_completed_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      workspace_name: workspaceName,
    },
  });

  return NextResponse.json({
    configured: true,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile,
    onboarded: true,
  });
}

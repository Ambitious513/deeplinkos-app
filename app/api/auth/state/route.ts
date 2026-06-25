import { NextResponse } from "next/server";

import { getAuthState, isProfileComplete } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getAuthState();

  return NextResponse.json({
    configured: state.configured,
    user: state.user,
    profile: state.profile,
    onboarded: isProfileComplete(state.profile),
  });
}

# Modal Google Auth Implementation

## Summary

DeepLinkOS now uses a sitewide Google auth modal instead of standalone login/signup pages. Public header auth actions and homepage generator auth gating open the modal in place.

## Current Behavior

- `/login` redirects to `/?auth=login`.
- `/signup` redirects to `/?auth=signup`.
- Logged-out dashboard access redirects to `/?auth=login&next=/dashboard`.
- Header `Log in` and `Get Started Free` open the modal without navigating.
- Homepage `Generate` opens the `Experience the magic` modal when the user is not fully onboarded.
- Google One Tap is homepage-only for logged-out users.
- First and last name are required before dashboard access.

## Required Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Google OAuth must also be enabled in Supabase Auth with the production and local origins configured in Google Cloud.

## v0 Polish Notes

The implementation owns the auth/session/profile contract. v0 can safely improve modal visuals, copy, motion, and responsive layout as long as it preserves:

- `usePublicAuth().openAuth(...)`
- `usePublicAuth().ensureGeneratorAccess(...)`
- `/api/auth/state`
- `/api/auth/profile`
- the first/last-name onboarding requirement


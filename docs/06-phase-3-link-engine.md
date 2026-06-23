# Phase 3 Link Engine

## Status

Phase 3 ports the protected DeepLinkOS core behavior into the clean app. It is now buildable and covered by focused unit tests for slug, inference, and routing logic.

## Added

- Link validation and update validation.
- Slug normalization and random slug creation.
- Destination inference for major social, commerce, marketplace, and custom links.
- Platform registry for Instagram, YouTube, WhatsApp, Telegram, TikTok, X/Twitter, Facebook, Messenger, Reddit, Pinterest, LinkedIn, Snapchat, Discord, Google Maps, Amazon, Walmart, Target, eBay, Etsy, Best Buy, Home Depot, AliExpress, Shopify stores, and custom links.
- Server-side link preview endpoint for metadata, Open Graph image, and favicon detection.
- Platform detection and destination resolution.
- Request insight helpers for browser, OS, referrer, bot, and prefetch detection.
- Password/IP hashing helpers.
- Supabase-backed link store functions.
- `GET /api/links`
- `POST /api/links`
- `PATCH /api/links/[slug]`
- `PUT /api/links/[slug]`
- `DELETE /api/links/[slug]`
- Real `/r/[slug]` redirect behavior.

## Preserved Product Behavior

- Link creation requires an authenticated user.
- Missing, inactive, paused, unknown-domain, and expired links go to `/missing`.
- Password-protected links show a gate and do not leak the destination.
- Desktop traffic redirects server-side to web fallback.
- Mobile in-app webviews get a lightweight app-open interstitial.
- UTM parameters are appended, with incoming click UTMs overriding stored link defaults.
- A/B links assign variant `a` or `b`; variant `b` uses `ab_test_url`.
- Human click tracking is deferred with `after()`.
- Bot and prefetch traffic is not counted.
- Click rows include device, OS, browser, referrer, country, IP hash, variant, and UTM fields.
- Default-domain links resolve only where `domain_id is null`.
- Custom-domain requests resolve through an active domain record.
- Affiliate parameters are preserved because inference keeps the original destination URL and query string intact.

## Verification

- `npm.cmd run build`
- `npm.cmd test`

## Known Follow-Ups

- Add integration smoke tests once Supabase project credentials are configured.
- Add custom domain management UI/API after dashboard data flows are wired.
- Decide whether to make A/B weighting mean "percent to B" in the UI copy; the engine currently treats `ab_test_weight` as B-variant traffic percentage.

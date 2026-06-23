import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || /^(https?:\/\/|[a-z][a-z0-9+.-]*:\/\/)/i.test(value), {
    message: "Use a valid URL or app URI scheme.",
  });

const optionalString = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const linkFieldsSchema = z.object({
    destinationUrl: optionalUrl,
    title: optionalString(90),
    description: optionalString(240),
    preset: z
      .enum([
        "custom",
        "instagram",
        "facebook",
        "messenger",
        "whatsapp",
        "telegram",
        "tiktok",
        "youtube",
        "twitter",
        "reddit",
        "pinterest",
        "linkedin",
        "snapchat",
        "discord",
        "google-maps",
        "amazon",
        "walmart",
        "target",
        "ebay",
        "etsy",
        "best-buy",
        "home-depot",
        "aliexpress",
        "shopify",
      ])
      .optional(),
    slug: optionalString(64),
    iosDeepLink: optionalUrl,
    iosStoreUrl: optionalUrl,
    androidDeepLink: optionalUrl,
    androidStoreUrl: optionalUrl,
    desktopUrl: optionalUrl,
    fallbackUrl: optionalUrl,
    campaign: optionalString(100),
    password: optionalString(120),
    expiresAt: optionalString(80),
    abTestUrl: optionalUrl,
    abTestWeight: z.number().int().min(0).max(100).optional(),
    utmSource: optionalString(100),
    utmMedium: optionalString(100),
    utmCampaign: optionalString(100),
    utmTerm: optionalString(100),
    utmContent: optionalString(100),
    tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  });

export const createLinkSchema = linkFieldsSchema
  .superRefine((value, ctx) => {
    if (!value.destinationUrl && !value.iosDeepLink && !value.androidDeepLink && !value.desktopUrl && !value.fallbackUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a destination link first.",
        path: ["destinationUrl"],
      });
    }
  });

export const updateLinkSchema = linkFieldsSchema.partial().extend({
  isActive: z.boolean().optional(),
  status: z.enum(["active", "paused", "archived", "locked"]).optional(),
});

export const toggleLinkSchema = z.object({
  is_active: z.boolean(),
});

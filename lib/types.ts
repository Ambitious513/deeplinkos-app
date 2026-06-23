import type { Database, Json } from "@/lib/database.types";

export type PresetKey =
  | "custom"
  | "instagram"
  | "facebook"
  | "messenger"
  | "whatsapp"
  | "telegram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "reddit"
  | "pinterest"
  | "linkedin"
  | "snapchat"
  | "discord"
  | "google-maps"
  | "amazon"
  | "walmart"
  | "target"
  | "ebay"
  | "etsy"
  | "best-buy"
  | "home-depot"
  | "aliexpress"
  | "shopify";

export type DevicePlatform = "ios" | "android" | "desktop" | "unknown";

export type LinkStatus = Database["public"]["Tables"]["deep_links"]["Row"]["status"];

export type LinkRecord = {
  id: string;
  userId: string;
  domainId: string | null;
  slug: string;
  title: string;
  description: string | null;
  preset: PresetKey;
  status: LinkStatus;
  isActive: boolean;
  destinationUrl: string | null;
  iosDeepLink: string | null;
  iosStoreUrl: string | null;
  androidDeepLink: string | null;
  androidStoreUrl: string | null;
  desktopUrl: string | null;
  fallbackUrl: string | null;
  passwordHash: string | null;
  expiresAt: string | null;
  abTestUrl: string | null;
  abTestWeight: number;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  routingConfig: Json;
  metadata: Json;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateLinkInput = {
  destinationUrl?: string;
  title?: string;
  description?: string;
  preset?: PresetKey;
  slug?: string;
  iosDeepLink?: string;
  iosStoreUrl?: string;
  androidDeepLink?: string;
  androidStoreUrl?: string;
  desktopUrl?: string;
  fallbackUrl?: string;
  campaign?: string;
  password?: string;
  expiresAt?: string;
  abTestUrl?: string;
  abTestWeight?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  tags?: string[];
};

export type UpdateLinkInput = Partial<CreateLinkInput> & {
  isActive?: boolean;
  status?: LinkStatus;
};

export type ResolvedDestination = {
  platform: DevicePlatform;
  destination: string;
  reason: "deep-link" | "store-fallback" | "web-fallback" | "generic-fallback";
};

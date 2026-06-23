import type { PresetKey } from "./types";

type PlatformCategory = "social" | "commerce" | "utility" | "custom";

export type PlatformDefinition = {
  key: PresetKey;
  label: string;
  category: PlatformCategory;
  hostPatterns: RegExp[];
  iosScheme?: string;
  androidPackage?: string;
  androidScheme?: string;
};

export const platformRegistry: PlatformDefinition[] = [
  {
    key: "instagram",
    label: "Instagram",
    category: "social",
    hostPatterns: [/(\.|^)instagram\.com$/],
    iosScheme: "instagram",
    androidPackage: "com.instagram.android",
  },
  {
    key: "facebook",
    label: "Facebook",
    category: "social",
    hostPatterns: [/(\.|^)facebook\.com$/, /^fb\.com$/, /^m\.facebook\.com$/],
    iosScheme: "fb",
    androidPackage: "com.facebook.katana",
  },
  {
    key: "messenger",
    label: "Messenger",
    category: "social",
    hostPatterns: [/(\.|^)m\.me$/, /(\.|^)messenger\.com$/],
    iosScheme: "fb-messenger-public",
    androidPackage: "com.facebook.orca",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    category: "social",
    hostPatterns: [/^wa\.me$/, /(\.|^)whatsapp\.com$/],
    iosScheme: "whatsapp",
    androidPackage: "com.whatsapp",
    androidScheme: "whatsapp",
  },
  {
    key: "telegram",
    label: "Telegram",
    category: "social",
    hostPatterns: [/^t\.me$/, /(\.|^)telegram\.me$/, /(\.|^)telegram\.org$/],
    iosScheme: "tg",
    androidPackage: "org.telegram.messenger",
    androidScheme: "tg",
  },
  {
    key: "tiktok",
    label: "TikTok",
    category: "social",
    hostPatterns: [/(\.|^)tiktok\.com$/],
    iosScheme: "snssdk1233",
    androidPackage: "com.zhiliaoapp.musically",
  },
  {
    key: "youtube",
    label: "YouTube",
    category: "social",
    hostPatterns: [/(\.|^)youtube\.com$/, /^youtu\.be$/],
    iosScheme: "vnd.youtube",
    androidPackage: "com.google.android.youtube",
  },
  {
    key: "twitter",
    label: "X",
    category: "social",
    hostPatterns: [/^x\.com$/, /(\.|^)twitter\.com$/],
    iosScheme: "twitter",
    androidPackage: "com.twitter.android",
  },
  {
    key: "reddit",
    label: "Reddit",
    category: "social",
    hostPatterns: [/(\.|^)reddit\.com$/, /^redd\.it$/],
    iosScheme: "reddit",
    androidPackage: "com.reddit.frontpage",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    category: "social",
    hostPatterns: [/(\.|^)pinterest\.com$/, /^pin\.it$/],
    iosScheme: "pinterest",
    androidPackage: "com.pinterest",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    category: "social",
    hostPatterns: [/(\.|^)linkedin\.com$/, /^lnkd\.in$/],
    iosScheme: "voyager",
    androidPackage: "com.linkedin.android",
  },
  {
    key: "snapchat",
    label: "Snapchat",
    category: "social",
    hostPatterns: [/(\.|^)snapchat\.com$/],
    iosScheme: "snapchat",
    androidPackage: "com.snapchat.android",
  },
  {
    key: "discord",
    label: "Discord",
    category: "social",
    hostPatterns: [/(\.|^)discord\.com$/, /^discord\.gg$/],
    iosScheme: "discord",
    androidPackage: "com.discord",
  },
  {
    key: "google-maps",
    label: "Google Maps",
    category: "utility",
    hostPatterns: [/^maps\.app\.goo\.gl$/, /(\.|^)google\.[a-z.]+$/],
    iosScheme: "comgooglemaps",
    androidPackage: "com.google.android.apps.maps",
  },
  {
    key: "amazon",
    label: "Amazon",
    category: "commerce",
    hostPatterns: [/(\.|^)amazon\.[a-z.]+$/, /^amzn\.to$/, /^a\.co$/],
    iosScheme: "com.amazon.mobile.shopping.web",
    androidPackage: "com.amazon.mShop.android.shopping",
  },
  {
    key: "walmart",
    label: "Walmart",
    category: "commerce",
    hostPatterns: [/(\.|^)walmart\.com$/],
    iosScheme: "walmart",
    androidPackage: "com.walmart.android",
    androidScheme: "walmart",
  },
  {
    key: "target",
    label: "Target",
    category: "commerce",
    hostPatterns: [/(\.|^)target\.com$/],
    iosScheme: "target",
    androidPackage: "com.target.ui",
    androidScheme: "target",
  },
  {
    key: "ebay",
    label: "eBay",
    category: "commerce",
    hostPatterns: [/(\.|^)ebay\.[a-z.]+$/],
    iosScheme: "ebay",
    androidPackage: "com.ebay.mobile",
    androidScheme: "ebay",
  },
  {
    key: "etsy",
    label: "Etsy",
    category: "commerce",
    hostPatterns: [/(\.|^)etsy\.com$/],
    iosScheme: "etsy",
    androidPackage: "com.etsy.android",
    androidScheme: "etsy",
  },
  {
    key: "best-buy",
    label: "Best Buy",
    category: "commerce",
    hostPatterns: [/(\.|^)bestbuy\.com$/],
    iosScheme: "bestbuy",
    androidPackage: "com.bestbuy.android",
    androidScheme: "bestbuy",
  },
  {
    key: "home-depot",
    label: "Home Depot",
    category: "commerce",
    hostPatterns: [/(\.|^)homedepot\.com$/],
    iosScheme: "homedepot",
    androidPackage: "com.thehomedepot",
    androidScheme: "homedepot",
  },
  {
    key: "aliexpress",
    label: "AliExpress",
    category: "commerce",
    hostPatterns: [/(\.|^)aliexpress\.com$/],
    iosScheme: "aliexpress",
    androidPackage: "com.alibaba.aliexpresshd",
  },
  {
    key: "shopify",
    label: "Shopify store",
    category: "commerce",
    hostPatterns: [/(\.|^)myshopify\.com$/],
  },
];

export function getPlatformDefinition(preset: PresetKey) {
  return platformRegistry.find((platform) => platform.key === preset);
}

export function getPlatformLabel(preset: PresetKey) {
  return getPlatformDefinition(preset)?.label || "Custom";
}

export function detectPlatformByHost(hostname: string, pathname = ""): PresetKey {
  const host = hostname.replace(/^www\./, "").toLowerCase();

  if (/(\.|^)google\.[a-z.]+$/.test(host) && !pathname.toLowerCase().startsWith("/maps")) {
    return "custom";
  }

  return platformRegistry.find((platform) => platform.hostPatterns.some((pattern) => pattern.test(host)))?.key || "custom";
}

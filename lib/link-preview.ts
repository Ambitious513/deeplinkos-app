import { detectPresetFromUrl, normalizeUrl } from "./inference";
import { getPlatformDefinition, getPlatformLabel } from "./platform-registry";

export type LinkPreview = {
  url: string;
  hostname: string;
  preset: string;
  label: string;
  category: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
};

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "::1" ||
    host.startsWith("[::1]")
  );
}

function attrValue(tag: string, attr: string) {
  const pattern = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1]?.trim() || null;
}

function findMeta(html: string, key: string) {
  const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const pattern = new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*>`, "i");
  const tag = html.match(pattern)?.[0];
  return tag ? attrValue(tag, "content") : null;
}

function findTitle(html: string) {
  const ogTitle = findMeta(html, "og:title") || findMeta(html, "twitter:title");
  if (ogTitle) return ogTitle;

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? title.replace(/\s+/g, " ").trim() : null;
}

function findIcon(html: string, baseUrl: URL) {
  const linkTags = html.match(/<link[^>]+>/gi) || [];
  const iconTag = linkTags.find((tag) => {
    const rel = attrValue(tag, "rel")?.toLowerCase() || "";
    return rel.includes("icon") || rel.includes("apple-touch-icon");
  });
  const href = iconTag ? attrValue(iconTag, "href") : null;

  if (!href) {
    return new URL("/favicon.ico", baseUrl).toString();
  }

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return new URL("/favicon.ico", baseUrl).toString();
  }
}

export async function fetchLinkPreview(input: string): Promise<LinkPreview> {
  const url = new URL(normalizeUrl(input));
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Preview metadata can only be fetched for http or https URLs.");
  }
  if (isBlockedHostname(url.hostname)) {
    throw new Error("This host cannot be previewed.");
  }

  const preset = detectPresetFromUrl(url.toString());
  const definition = getPlatformDefinition(preset);

  let html = "";
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "DeepLinkOSBot/1.0 (+https://deeplinkos.com)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(4500),
    });

    const contentType = response.headers.get("content-type") || "";
    if (response.ok && contentType.includes("text/html")) {
      html = (await response.text()).slice(0, 250_000);
    }
  } catch {
    html = "";
  }

  return {
    url: url.toString(),
    hostname: url.hostname.replace(/^www\./, ""),
    preset,
    label: getPlatformLabel(preset),
    category: definition?.category || "custom",
    title: html ? findTitle(html) : null,
    description: html ? findMeta(html, "og:description") || findMeta(html, "description") || findMeta(html, "twitter:description") : null,
    imageUrl: html ? findMeta(html, "og:image") || findMeta(html, "twitter:image") : null,
    iconUrl: html ? findIcon(html, url) : new URL("/favicon.ico", url).toString(),
  };
}

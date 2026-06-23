import { describe, expect, it } from "vitest";

import { detectPresetFromUrl, inferLinkFromDestination, normalizeUrl } from "./inference";

describe("link inference", () => {
  it("normalizes web URLs without a protocol", () => {
    expect(normalizeUrl("instagram.com/deeplinkos")).toBe("https://instagram.com/deeplinkos");
  });

  it("detects major presets from destination URLs", () => {
    expect(detectPresetFromUrl("https://instagram.com/deeplinkos")).toBe("instagram");
    expect(detectPresetFromUrl("https://youtu.be/abc123")).toBe("youtube");
    expect(detectPresetFromUrl("https://wa.me/15551234567")).toBe("whatsapp");
    expect(detectPresetFromUrl("https://reddit.com/r/marketing/comments/abc")).toBe("reddit");
    expect(detectPresetFromUrl("https://pinterest.com/pin/123456")).toBe("pinterest");
    expect(detectPresetFromUrl("https://www.amazon.com/dp/B08XYZ?tag=creator-20")).toBe("amazon");
    expect(detectPresetFromUrl("https://www.walmart.com/ip/12345")).toBe("walmart");
  });

  it("infers platform URLs and a usable slug", () => {
    const inferred = inferLinkFromDestination("https://youtube.com/@DeepLinkOS");

    expect(inferred.preset).toBe("youtube");
    expect(inferred.slug).toBe("deeplinkos");
    expect(inferred.desktopUrl).toBe("https://youtube.com/@DeepLinkOS");
    expect(inferred.iosDeepLink).toContain("vnd.youtube://");
    expect(inferred.androidDeepLink).toContain("Intent");
  });

  it("preserves affiliate parameters when inferring commerce links", () => {
    const inferred = inferLinkFromDestination("amazon.com/dp/B08XYZ?tag=creator-20&ascsubtag=campaign-a");

    expect(inferred.preset).toBe("amazon");
    expect(inferred.desktopUrl).toBe("https://amazon.com/dp/B08XYZ?tag=creator-20&ascsubtag=campaign-a");
    expect(inferred.iosDeepLink).toContain("tag=creator-20");
    expect(inferred.androidDeepLink).toContain(encodeURIComponent("https://amazon.com/dp/B08XYZ?tag=creator-20&ascsubtag=campaign-a"));
  });
});

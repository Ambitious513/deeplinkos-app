import { describe, expect, it } from "vitest";

import { detectPlatformByHost, getPlatformDefinition, getPlatformLabel } from "./platform-registry";

describe("platform registry", () => {
  it("detects commerce hosts for affiliate and marketplace links", () => {
    expect(detectPlatformByHost("amazon.com", "/dp/B08XYZ")).toBe("amazon");
    expect(detectPlatformByHost("a.co", "/abc123")).toBe("amazon");
    expect(detectPlatformByHost("walmart.com", "/ip/123")).toBe("walmart");
    expect(detectPlatformByHost("etsy.com", "/listing/123")).toBe("etsy");
  });

  it("detects missing social platforms", () => {
    expect(detectPlatformByHost("reddit.com", "/r/marketing")).toBe("reddit");
    expect(detectPlatformByHost("pin.it", "/abc")).toBe("pinterest");
    expect(detectPlatformByHost("linkedin.com", "/in/example")).toBe("linkedin");
  });

  it("keeps non-map Google links custom", () => {
    expect(detectPlatformByHost("google.com", "/search")).toBe("custom");
    expect(detectPlatformByHost("google.com", "/maps/place/test")).toBe("google-maps");
    expect(getPlatformLabel("best-buy")).toBe("Best Buy");
    expect(getPlatformDefinition("amazon")?.category).toBe("commerce");
  });
});

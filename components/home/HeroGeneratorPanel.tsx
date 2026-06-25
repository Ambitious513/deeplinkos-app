"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicAuth } from "@/components/auth/public-auth-shell";
import type { DetectedPlatform, LinkGeneratorAdapter } from "@/lib/types";

type HeroGeneratorPanelProps = {
  adapter?: LinkGeneratorAdapter;
};

const fallbackDetector = (url: string): DetectedPlatform => {
  const lower = url.toLowerCase();
  if (lower.includes("youtu")) return { name: "YouTube Smart Link", color: "#FF0000", hint: "Video route ready" };
  if (lower.includes("instagram")) return { name: "Instagram Smart Link", color: "#E1306C", hint: "Profile route ready" };
  if (lower.includes("tiktok")) return { name: "TikTok Smart Link", color: "#010101", hint: "Creator route ready" };
  if (lower.includes("whatsapp") || lower.includes("wa.me")) {
    return { name: "WhatsApp Smart Link", color: "#25D366", hint: "Chat route ready" };
  }
  if (lower.includes("maps.google") || lower.includes("goo.gl/maps")) {
    return { name: "Maps Smart Link", color: "#0F1C2E", hint: "Location route ready" };
  }
  return { name: "Universal Smart Link", color: "#3b82f6", hint: "Fallback route ready" };
};

export function HeroGeneratorPanel({ adapter }: HeroGeneratorPanelProps) {
  const { ensureGeneratorAccess } = usePublicAuth();
  const [url, setUrl] = useState("");
  const [hasError, setHasError] = useState(false);
  const [success, setSuccess] = useState(false);
  const detected = useMemo(() => {
    if (!url.trim()) return null;
    return adapter?.detectPlatform?.(url) ?? fallbackDetector(url);
  }, [adapter, url]);

  async function completeGeneration(destinationUrl: string) {
    if (adapter?.generate) {
      await adapter.generate(destinationUrl);
      return;
    }

    setSuccess(true);
  }

  useEffect(() => {
    async function handleAuthorized(event: Event) {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      if (!detail?.url || detail.url !== url) return;
      setHasError(false);
      await completeGeneration(detail.url);
    }

    window.addEventListener("deeplinkos:generator-authorized", handleAuthorized);
    return () => window.removeEventListener("deeplinkos:generator-authorized", handleAuthorized);
  }, [adapter, url]);

  async function handleGenerate() {
    const valid = isValidUrl(url);
    setHasError(!valid);
    setSuccess(false);
    if (!valid) return;

    const canGenerate = await ensureGeneratorAccess(url);
    if (!canGenerate) return;
    await completeGeneration(url);
  }

  function handleAdvanced() {
    if (!url || !isValidUrl(url)) {
      setHasError(true);
      return;
    }
    adapter?.openCompose?.(url);
  }

  return (
    <div className="hero-generator" aria-label="Generate a smart link">
      <div className={hasError ? "hero-url-row has-error" : "hero-url-row"}>
        <input
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setHasError(false);
            setSuccess(false);
          }}
          placeholder="Paste any URL: YouTube, Instagram, WhatsApp, TikTok..."
          aria-label="Destination URL"
        />
        <button className="hero-gen-btn" type="button" onClick={handleGenerate}>
          Generate
        </button>
      </div>
      {hasError ? <div className="hero-error-msg">Please enter a valid URL.</div> : null}
      <div className="hero-hint">
        <span className="hero-hint-icon">!</span>
        Platform detected - App-opening routes configured instantly
      </div>

      {detected && !success ? (
        <div className="hero-expanded">
          <div className="h-detected-row">
            <span className="h-det-icon" style={{ background: detected.color }}>
              Go
            </span>
            <div>
              <div className="h-det-name">{detected.name}</div>
              <div className="h-det-hint">{detected.hint}</div>
            </div>
          </div>
          <button className="locked-card" type="button" onClick={handleAdvanced}>
            <span className="locked-card-icon">*</span>
            <span className="locked-card-copy">
              <span className="locked-card-title">Fallbacks, UTMs and link preview</span>
              <span className="locked-card-sub">Open the compose flow to configure advanced routing.</span>
            </span>
            <span className="locked-card-cta">Configure</span>
          </button>
        </div>
      ) : null}

      {success ? (
        <div className="hero-success">
          <div className="success-icon">OK</div>
          <strong>Your smart link preview is ready</strong>
          <p>In production this state should be replaced by the existing LinkGenerator response.</p>
          <div className="short-link-pill">deeplinkos.com/r/campaign-preview</div>
          <button className="success-reset" type="button" onClick={() => setSuccess(false)}>
            Create another
          </button>
        </div>
      ) : null}
    </div>
  );
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

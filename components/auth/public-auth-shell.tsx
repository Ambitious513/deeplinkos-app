"use client";

import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { AuthProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/client";

type AuthIntent = "login" | "signup" | "generator";

type ClientAuthState = {
  configured: boolean;
  user: { id: string; email: string | null } | null;
  profile: AuthProfile | null;
  onboarded: boolean;
  loading: boolean;
};

type AuthModalState = {
  open: boolean;
  intent: AuthIntent;
  next: string;
  pendingUrl?: string;
};

type PublicAuthContextValue = {
  authState: ClientAuthState;
  openAuth: (intent: AuthIntent, options?: { next?: string; pendingUrl?: string }) => void;
  ensureGeneratorAccess: (url: string) => Promise<boolean>;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id?: string;
      callback: (response: GoogleCredentialResponse) => void;
      nonce?: string;
      auto_select?: boolean;
      itp_support?: boolean;
      use_fedcm_for_prompt?: boolean;
    }) => void;
    renderButton: (
      element: HTMLElement,
      options: {
        type?: "standard" | "icon";
        theme?: "outline" | "filled_blue" | "filled_black";
        size?: "large" | "medium" | "small";
        shape?: "pill" | "rectangular" | "circle" | "square";
        text?: "signin_with" | "signup_with" | "continue_with";
        logo_alignment?: "left" | "center";
        width?: number;
      },
    ) => void;
    prompt: () => void;
    cancel: () => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const initialAuthState: ClientAuthState = {
  configured: false,
  user: null,
  profile: null,
  onboarded: false,
  loading: true,
};

const PublicAuthContext = createContext<PublicAuthContextValue | null>(null);

export function usePublicAuth() {
  const context = useContext(PublicAuthContext);
  if (!context) {
    throw new Error("usePublicAuth must be used inside PublicAuthShell.");
  }
  return context;
}

export function PublicAuthShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [scriptReady, setScriptReady] = useState(false);
  const [authState, setAuthState] = useState<ClientAuthState>(initialAuthState);
  const [modal, setModal] = useState<AuthModalState>({
    open: false,
    intent: "signup",
    next: "/dashboard",
  });
  const handledSearchRef = useRef(false);
  const oneTapPromptedRef = useRef(false);

  const refreshAuthState = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/state", { cache: "no-store" });
      const nextState = (await response.json()) as Omit<ClientAuthState, "loading">;
      const hydrated = { ...nextState, loading: false };
      setAuthState(hydrated);
      return hydrated;
    } catch {
      const fallback = { ...initialAuthState, loading: false };
      setAuthState(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    void refreshAuthState();
  }, [refreshAuthState]);

  const openAuth = useCallback((intent: AuthIntent, options?: { next?: string; pendingUrl?: string }) => {
    setModal({
      open: true,
      intent,
      next: safeInternalPath(options?.next || (intent === "login" ? "/dashboard" : "/dashboard")),
      pendingUrl: options?.pendingUrl,
    });
  }, []);

  useEffect(() => {
    if (handledSearchRef.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (auth !== "login" && auth !== "signup" && auth !== "generator") return;

    handledSearchRef.current = true;
    openAuth(auth, {
      next: params.get("next") || "/dashboard",
      pendingUrl: params.get("url") || undefined,
    });

    params.delete("auth");
    params.delete("next");
    params.delete("url");
    const nextSearch = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`);
  }, [openAuth]);

  const completeIntent = useCallback(
    (intent: AuthIntent, next: string, pendingUrl?: string) => {
      setModal((current) => ({ ...current, open: false }));

      if (intent === "generator") {
        window.dispatchEvent(new CustomEvent("deeplinkos:generator-authorized", { detail: { url: pendingUrl } }));
        router.refresh();
        return;
      }

      router.push(safeInternalPath(next || "/dashboard"));
    },
    [router],
  );

  const ensureGeneratorAccess = useCallback(
    async (url: string) => {
      const state = await refreshAuthState();
      if (state.user && state.onboarded) return true;
      openAuth("generator", { next: "/dashboard/links", pendingUrl: url });
      return false;
    },
    [openAuth, refreshAuthState],
  );

  const handleGoogleCredential = useCallback(
    async (credential: string, rawNonce: string, intent: AuthIntent, next: string, pendingUrl?: string) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
        nonce: rawNonce,
      });

      if (error) throw error;

      const nextState = await refreshAuthState();
      if (nextState.user && nextState.onboarded) {
        completeIntent(intent, next, pendingUrl);
      } else if (nextState.user) {
        setModal({ open: true, intent, next, pendingUrl });
      }
    },
    [completeIntent, refreshAuthState],
  );

  useEffect(() => {
    if (!scriptReady || !googleClientId || pathname !== "/" || authState.loading || authState.user || modal.open) return;
    if (oneTapPromptedRef.current || !window.google?.accounts.id) return;

    oneTapPromptedRef.current = true;

    void generateNoncePair().then(([rawNonce, hashedNonce]) => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) return;
          try {
            await handleGoogleCredential(response.credential, rawNonce, "signup", "/dashboard");
          } catch {
            openAuth("signup", { next: "/dashboard" });
          }
        },
        nonce: hashedNonce,
        auto_select: false,
        itp_support: true,
        use_fedcm_for_prompt: true,
      });
      window.google?.accounts.id.prompt();
    });
  }, [authState.loading, authState.user, googleClientId, handleGoogleCredential, modal.open, openAuth, pathname, scriptReady]);

  const contextValue = useMemo(
    () => ({ authState, openAuth, ensureGeneratorAccess }),
    [authState, ensureGeneratorAccess, openAuth],
  );

  return (
    <PublicAuthContext.Provider value={contextValue}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div className="bg-orb bg-orb--1" />
      <div className="bg-orb bg-orb--2" />
      <div className="bg-orb bg-orb--3" />
      <SiteHeader onLogin={() => openAuth("login", { next: "/dashboard" })} onSignup={() => openAuth("signup", { next: "/dashboard" })} />
      <main>{children}</main>
      <SiteFooter />
      <AuthModal
        authState={authState}
        completeIntent={completeIntent}
        googleClientId={googleClientId}
        handleGoogleCredential={handleGoogleCredential}
        modal={modal}
        refreshAuthState={refreshAuthState}
        scriptReady={scriptReady}
        setAuthState={setAuthState}
        setModal={setModal}
      />
    </PublicAuthContext.Provider>
  );
}

function AuthModal({
  authState,
  completeIntent,
  googleClientId,
  handleGoogleCredential,
  modal,
  refreshAuthState,
  scriptReady,
  setAuthState,
  setModal,
}: {
  authState: ClientAuthState;
  completeIntent: (intent: AuthIntent, next: string, pendingUrl?: string) => void;
  googleClientId?: string;
  handleGoogleCredential: (credential: string, rawNonce: string, intent: AuthIntent, next: string, pendingUrl?: string) => Promise<void>;
  modal: AuthModalState;
  refreshAuthState: () => Promise<ClientAuthState>;
  scriptReady: boolean;
  setAuthState: (state: ClientAuthState) => void;
  setModal: (state: AuthModalState | ((state: AuthModalState) => AuthModalState)) => void;
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const copy = modalCopy[modal.intent];
  const showProfileStep = Boolean(authState.user && !authState.onboarded);

  useEffect(() => {
    if (!modal.open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modal.open]);

  useEffect(() => {
    if (!modal.open || showProfileStep || !scriptReady || !googleClientId || !buttonRef.current || !window.google?.accounts.id) return;

    setError(null);
    buttonRef.current.innerHTML = "";

    void generateNoncePair().then(([rawNonce, hashedNonce]) => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setError("Google did not return a credential. Please try again.");
            return;
          }

          try {
            await handleGoogleCredential(response.credential, rawNonce, modal.intent, modal.next, modal.pendingUrl);
          } catch (googleError) {
            setError(googleError instanceof Error ? googleError.message : "Google sign-in failed. Please try again.");
          }
        },
        nonce: hashedNonce,
        itp_support: true,
        use_fedcm_for_prompt: true,
      });
      window.google?.accounts.id.renderButton(buttonRef.current!, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: modal.intent === "login" ? "signin_with" : "signup_with",
        logo_alignment: "left",
        width: 320,
      });
    });
  }, [googleClientId, handleGoogleCredential, modal.intent, modal.next, modal.open, modal.pendingUrl, scriptReady, showProfileStep]);

  if (!modal.open) return null;

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmittingProfile(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
      }),
    });

    const payload = await response.json().catch(() => null);
    setSubmittingProfile(false);

    if (!response.ok) {
      setError(payload?.error || "We could not save your profile. Please try again.");
      return;
    }

    setAuthState({ ...payload, loading: false });
    completeIntent(modal.intent, modal.next, modal.pendingUrl);
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => setModal((current) => ({ ...current, open: false }))}>
      <section
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="auth-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-modal-close" type="button" aria-label="Close auth dialog" onClick={() => setModal((current) => ({ ...current, open: false }))}>
          <CloseIcon />
        </button>

        <div className="auth-modal-visual" aria-hidden="true">
          <span className="auth-modal-spark">D</span>
          <span className="auth-modal-route auth-modal-route--one" />
          <span className="auth-modal-route auth-modal-route--two" />
        </div>

        <div className="auth-modal-content">
          <span className="auth-modal-kicker">{showProfileStep ? "Almost there" : copy.kicker}</span>
          <h2 id="auth-modal-title">{showProfileStep ? "Tell us what to call you" : copy.title}</h2>
          <p>{showProfileStep ? "Your workspace is ready. Add your name so the dashboard feels like yours from the first click." : copy.body}</p>

          {!authState.configured ? (
            <p className="auth-modal-alert">Supabase env vars are not configured yet. Add them before testing Google auth.</p>
          ) : !googleClientId && !showProfileStep ? (
            <p className="auth-modal-alert">Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
          ) : null}

          {error ? <p className="auth-modal-alert auth-modal-alert--error">{error}</p> : null}

          {showProfileStep ? (
            <form className="auth-modal-form" onSubmit={handleProfileSubmit}>
              <label>
                First name
                <input name="first_name" autoComplete="given-name" defaultValue={authState.profile?.first_name ?? ""} required />
              </label>
              <label>
                Last name
                <input name="last_name" autoComplete="family-name" defaultValue={authState.profile?.last_name ?? ""} required />
              </label>
              <button className="btn btn-primary auth-modal-submit" type="submit" disabled={submittingProfile}>
                {submittingProfile ? "Preparing your dashboard..." : "Continue to dashboard"}
              </button>
            </form>
          ) : (
            <div className="auth-modal-google-wrap">
              <div ref={buttonRef} className="auth-modal-google" />
              {!scriptReady ? <span className="auth-modal-loading">Loading secure Google sign-in...</span> : null}
            </div>
          )}

          <button className="auth-modal-refresh" type="button" onClick={() => void refreshAuthState()}>
            Already signed in? Refresh session
          </button>
        </div>
      </section>
    </div>
  );
}

const modalCopy: Record<AuthIntent, { kicker: string; title: string; body: string }> = {
  login: {
    kicker: "Welcome back",
    title: "Pick up your smart links where you left off",
    body: "Sign in with Google and jump back into your dashboard, campaigns, QR codes, and link analytics.",
  },
  signup: {
    kicker: "Start free",
    title: "Create your DeepLinkOS workspace in one click",
    body: "Use Google to start securely. No password to remember, no setup maze, just your first smart link.",
  },
  generator: {
    kicker: "Experience the magic",
    title: "Save this smart route to your workspace",
    body: "Sign in with Google to keep the generated link, add fallbacks, and turn it into a trackable campaign.",
  },
};

async function generateNoncePair(): Promise<[string, string]> {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((value) => value.toString(16).padStart(2, "0")).join("");
  return [nonce, hashedNonce];
}

function safeInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

import { useEffect, useReducer, useState } from "react";
import { Download, Share, X } from "lucide-react";

/** The `beforeinstallprompt` event isn't in the standard DOM lib types yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ------------------------------------------------------------------ *
 * Shared install state — a tiny module-level store so every button
 * (the floating one and the footer one) stays in sync: capturing the
 * event, and clearing it once the app is installed or the prompt used.
 * ------------------------------------------------------------------ */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let started = false;
const subscribers = new Set<() => void>();

const notify = () => subscribers.forEach((fn) => fn());

function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // stop Chrome's default mini-infobar
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

// Register listeners as early as the bundle loads in the browser, so we don't
// miss the event before a component mounts. Guarded for SSR (vite-react-ssg).
ensureStarted();

/** Subscribe to install availability and get an `install()` trigger. */
function usePwaInstall() {
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    ensureStarted();
    subscribers.add(force);
    return () => {
      subscribers.delete(force);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice; // 'accepted' | 'dismissed'
    deferredPrompt = null; // the prompt can only be used once
    notify();
  };

  return { canInstall: !!deferredPrompt, install };
}

/**
 * True on iOS/iPadOS devices that can install via Safari's share sheet but not
 * yet running as an installed app. iOS/WebKit never fires `beforeinstallprompt`,
 * so these users need a manual "Add to Home Screen" hint instead of a button.
 */
function isIosInstallCandidate(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as a Mac, so fall back to a touch check.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !isStandalone;
}

/**
 * PWA install button. Renders nothing unless the app is installable (and not
 * already installed / on an unsupported browser).
 *
 * - variant="floating" (default): a pill pinned to the bottom-right, dismissable.
 * - variant="inline": a plain button that flows with surrounding content (footer).
 */
export default function InstallButton({
  variant = "floating",
}: {
  variant?: "floating" | "inline";
}) {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  // Detect iOS on the client only (SSR-safe): decides the manual-hint fallback.
  useEffect(() => setIosHint(isIosInstallCandidate()), []);

  if (variant === "inline") {
    if (canInstall) {
      return (
        <div className="mt-4">
          <button
            type="button"
            onClick={install}
            className="btn-primary"
            aria-label="Install True Followers app"
          >
            <Download className="h-4 w-4" /> Install app
          </button>
        </div>
      );
    }
    // iOS Safari can't use the button — show a manual install hint instead.
    if (iosHint) {
      return (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          Install: tap <Share className="h-4 w-4" /> Share → “Add to Home
          Screen”
        </p>
      );
    }
    return null;
  }

  // Floating variant is Chromium-only (relies on the install prompt).
  if (!canInstall || dismissed) return null;

  return (
    <>
      {/* Soft fade behind the button so it reads cleanly over any content. */}
      <div className="install-scrim animate-fade pointer-events-none fixed bottom-0 right-0 z-40 h-48 w-96" />
      <div className="animate-pop fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={install}
          className="btn-primary"
          aria-label="Install True Followers app"
        >
          <Download className="h-4 w-4" />
          Install app
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="btn-secondary !px-2.5"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

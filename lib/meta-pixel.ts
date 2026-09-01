"use client";

export const META_PIXEL_ID = "1623865512480809";
export const MARKETING_CONSENT_KEY = "planotracker:marketing-consent";

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: MetaPixelFunction;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    __planotrackerMetaPixelInitialized?: boolean;
  }
}

export function hasMarketingConsent() {
  return typeof window !== "undefined" && window.localStorage.getItem(MARKETING_CONSENT_KEY) === "granted";
}

export function initializeMetaPixel() {
  if (typeof window === "undefined" || !hasMarketingConsent()) return false;

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as MetaPixelFunction;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;

    if (!document.getElementById("meta-pixel-script")) {
      const script = document.createElement("script");
      script.id = "meta-pixel-script";
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
  }

  if (!window.__planotrackerMetaPixelInitialized) {
    window.fbq("init", META_PIXEL_ID);
    window.__planotrackerMetaPixelInitialized = true;
  }

  window.fbq("consent", "grant");

  return true;
}

export function revokeMetaPixelConsent() {
  if (typeof window !== "undefined" && window.fbq) window.fbq("consent", "revoke");
}

export function trackMetaEvent(eventName: string, parameters?: Record<string, unknown>) {
  if (!initializeMetaPixel() || !window.fbq) return;
  window.fbq("track", eventName, parameters || {});
}

export function trackMetaCustomEvent(eventName: string, parameters?: Record<string, unknown>) {
  if (!initializeMetaPixel() || !window.fbq) return;
  window.fbq("trackCustom", eventName, parameters || {});
}

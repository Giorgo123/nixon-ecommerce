import { toMetaEvent } from "@/lib/meta-events";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function trackPageview(url: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }

  if (typeof window.fbq === "function") {
    const metaEvent = toMetaEvent(name, params);
    if (!metaEvent) return;

    if (metaEvent.eventId) {
      window.fbq("track", metaEvent.event, metaEvent.payload, {
        eventID: metaEvent.eventId,
      });
    } else {
      window.fbq("track", metaEvent.event, metaEvent.payload);
    }
  }
}

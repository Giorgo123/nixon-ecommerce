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
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

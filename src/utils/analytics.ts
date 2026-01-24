/**
 * Analytics Utilities
 *
 * Provider-agnostic analytics tracking.
 * Currently supports: GA4
 * Designed for easy addition of other providers.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Injects the GA4 script tag into the document head.
 * Should be called once on page load when analytics is configured.
 */
export function injectGA4Script(measurementId: string): void {
  if (typeof window === "undefined") return;

  // Check if already injected
  if (document.querySelector(`script[src*="${measurementId}"]`)) return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];

  // Define gtag function
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  // Set initial timestamp
  window.gtag("js", new Date());

  // Configure the measurement ID
  window.gtag("config", measurementId);

  // Inject the script tag
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

/**
 * Generic event tracking - works with any configured analytics provider.
 * Currently routes to GA4, can be extended for other providers.
 */
export function track(
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window === "undefined") return;

  // GA4
  if (window.gtag) {
    window.gtag("event", eventName, params);
  }

  // Future: add other providers here
  // if (window.plausible) { ... }
  // if (window.umami) { ... }
}

/**
 * Check if analytics is ready.
 */
export function isAnalyticsReady(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.gtag === "function";
}

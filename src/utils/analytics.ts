
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export function injectGA4Script(measurementId: string): void {
  if (typeof window === "undefined") return;

  if (document.querySelector(`script[src*="${measurementId}"]`)) return;

  window.dataLayer = window.dataLayer || [];

  window.gtag = function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());

  window.gtag("config", measurementId);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

export function track(
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", eventName, params);
  }

}

export function isAnalyticsReady(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.gtag === "function";
}

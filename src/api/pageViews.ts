import type { StorefrontApiConfig } from "../services/clientTypes";
import type { SendPageViewParams } from "../types/pageView";

export const PAGE_VIEW_PATH = "/v1/storefront/page-views";

export const createStorefrontPageViewsApi = (apiConfig: Pick<StorefrontApiConfig, "apiUrl" | "publishableKey">) => ({
  send(params: SendPageViewParams): void {
    if (typeof params?.path !== "string" || !params.path.startsWith("/")) {
      throw new TypeError("A page view needs the page path, starting with /");
    }
    if (params.referrer !== undefined && params.referrer !== null && typeof params.referrer !== "string") {
      throw new TypeError("A page view referrer is the browser's referrer URL");
    }
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
      throw new Error("Page views are sent from a browser that supports navigator.sendBeacon");
    }
    const body = JSON.stringify({
      publishable_key: apiConfig.publishableKey,
      path: params.path,
      referrer: params.referrer || null,
    });
    if (!navigator.sendBeacon(`${apiConfig.apiUrl}${PAGE_VIEW_PATH}`, body)) {
      throw new Error("The browser did not queue the page view");
    }
  },
});

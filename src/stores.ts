import { atom, computed } from "nanostores";

export interface StorefrontStores {
  business: ReturnType<typeof atom<any>>;
  market: ReturnType<typeof atom<any>>;
  loading: ReturnType<typeof atom<boolean>>;
  error: ReturnType<typeof atom<string | null>>;
  initialized: ReturnType<typeof atom<boolean>>;
  currency: ReturnType<typeof computed>;
  currencySymbol: ReturnType<typeof computed>;
  paymentMethods: ReturnType<typeof computed>;
  paymentMethodObjects: ReturnType<typeof computed>;
  paymentConfig: ReturnType<typeof computed>;
  zones: ReturnType<typeof computed>;
}

export function createStores() {
  const $business = atom<any>(null);
  const $market = atom<any>(null);
  const $loading = atom(false);
  const $error = atom<string | null>(null);
  const $initialized = atom(false);

  const $currency = computed($market, (m) => m?.currency);

  const $currencySymbol = computed($market, (m) => {
    if (!m?.currency) return undefined;
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: m.currency.toUpperCase(),
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p: Intl.NumberFormatPart) => p.type === "currency")?.value || m.currency.toUpperCase();
  });

  const $paymentMethods = computed($market, (m) =>
    (m?.payment_methods || []).map((pm: any) => pm.id),
  );

  const $paymentMethodObjects = computed(
    $market,
    (m) => m?.payment_methods || [],
  );

  const $paymentConfig = computed([$business, $paymentMethods], (biz, methods) => {
    const payment = biz?.payment || null;
    const hasCreditCard = methods.includes("credit_card");
    return {
      provider: payment,
      enabled: hasCreditCard && !!payment,
    };
  });

  const $zones = computed($market, (m) => m?.zones || []);

  return {
    business: $business,
    market: $market,
    loading: $loading,
    error: $error,
    initialized: $initialized,
    currency: $currency,
    currencySymbol: $currencySymbol,
    paymentMethods: $paymentMethods,
    paymentMethodObjects: $paymentMethodObjects,
    paymentConfig: $paymentConfig,
    zones: $zones,
  };
}

export function populateStores(
  stores: ReturnType<typeof createStores>,
  data: { business: any; market: any },
) {
  stores.business.set(data.business);
  stores.market.set(data.market);
  stores.initialized.set(true);
}

export function resetStores(stores: ReturnType<typeof createStores>) {
  stores.business.set(null);
  stores.market.set(null);
  stores.loading.set(false);
  stores.error.set(null);
  stores.initialized.set(false);
}

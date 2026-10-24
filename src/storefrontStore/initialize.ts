import { atom, computed } from "nanostores";
import { CartError } from "../types/cartSelection";
import type { StorefrontMarket, StorefrontSetup } from "../types/storefront";
import { isOrderToken } from "../utils/orderToken";
import { requireId } from "../utils/ids";
import { createStorefront, type StorefrontCustomerSession } from "../index";
import { cartScopeKey } from "../services/cartSelection";
import { createBookingCalendar, type BookingCalendar } from "./bookingCalendar";
import { createCartStore, type CartScope, type CartStore, type CartStoreContext } from "./cart";
import { createCheckoutFlow, type CheckoutFlow } from "./checkoutFlow";
import type { ArkyCartScope, ArkyStoreConfig, ArkyStoreContext } from "./types";

function initializeStoreCore(publishableKey: string, config: ArkyStoreConfig) {
  const client = createStorefront(publishableKey, config);
  const session = atom<StorefrontCustomerSession | null>(client.session);
  const setup = atom<StorefrontSetup | null>(null);
  const locale = atom(client.getLocale());
  const market_key = atom(client.getMarket());
  const resolvedMarket = atom<StorefrontMarket | null>(null);
  const market = computed([market_key, resolvedMarket], (key, value) => (key && value?.key === key ? value : null));
  const currency = computed(market, (value) => value?.currency ?? null);
  const allowed_payment_option_ids = computed(market, (value) => value?.payment_option_ids ?? []);

  let contextRevision = 0;
  let sessionRequest: Promise<StorefrontCustomerSession | null> | null = null;

  const cartStores = new Map<string, CartStore>();
  const contextInvalidators = new Set<() => void>();
  const checkoutFlows = new Map<string, CheckoutFlow>();
  const bookingCalendars = new Map<string, BookingCalendar>();

  function invalidateContext(): void {
    contextRevision += 1;
    for (const invalidate of contextInvalidators) invalidate();
  }

  function sameBuyer(left: StorefrontCustomerSession | null, right: StorefrontCustomerSession | null): boolean {
    return left?.customer.id === right?.customer.id && left?.type === right?.type;
  }

  function synchronizeSession(): void {
    const current = client.session;
    const previous = session.get();
    if (!sameBuyer(current, previous)) invalidateContext();
    session.set(current);
  }

  client.onAuthStateChanged(synchronizeSession);

  function requireLocale(): string {
    const value = locale.get();
    if (!value) throw new TypeError("Set the storefront language with setContext({ locale }) first");
    return value;
  }

  function newId(label: string): string {
    return requireId(config.createId(), label);
  }

  function newOrderToken(): string {
    const token = config.createOrderToken();
    if (!isOrderToken(token)) {
      throw new TypeError("createOrderToken must answer an order token: 32 random bytes in canonical base64url after arky_ot_");
    }
    return token;
  }

  async function loadSetup(): Promise<StorefrontSetup> {
    const key = market_key.get();
    const revision = contextRevision;
    const result = setup.get() ?? (await client.getSetup());
    const value = key ? await client.store.market.getByKey({ key }) : null;
    if (revision !== contextRevision || key !== market_key.get()) {
      throw new CartError("context_changed", "The market changed while the store setup was loading");
    }
    if (value && value.key !== key) throw new CartError("answer_mismatch", "The market read didn't confirm the selected key");
    setup.set(result);
    resolvedMarket.set(value);
    return result;
  }

  async function ensureSession(): Promise<StorefrontCustomerSession | null> {
    synchronizeSession();
    if (client.hasSession) return client.session;
    if (!sessionRequest) {
      sessionRequest = client.customer
        .identify()
        .then(() => client.session)
        .finally(() => {
          sessionRequest = null;
        });
    }
    const result = await sessionRequest;
    synchronizeSession();
    return result;
  }

  function setContext(context: ArkyStoreContext): void {
    if (context.market !== undefined && context.market !== market_key.get()) {
      client.setContext({ market: context.market });
      market_key.set(client.getMarket());
      invalidateContext();
    }
    if (context.locale !== undefined && context.locale !== locale.get()) {
      for (const store of cartStores.values()) store.quote_result.set(null);
      client.setContext({ locale: context.locale });
      locale.set(client.getLocale());
    }
  }

  async function beginCartOperation(): Promise<CartScope> {
    synchronizeSession();
    const requestedSession = client.session;
    const requestedRevision = contextRevision;
    await ensureSession();
    const current = client.session;
    const revision = contextRevision;
    if (!current || (requestedSession && requestedRevision !== revision)) {
      throw new CartError("context_changed", "The buyer or the store context changed; reload the cart");
    }
    const isCurrent = () => revision === contextRevision && sameBuyer(client.session, current);
    return {
      customerId: current.customer.id,
      isCurrent,
      assertCurrent() {
        if (!isCurrent()) throw new CartError("context_changed", "The buyer or the store context changed during the cart operation");
      },
    };
  }

  const cartContext: CartStoreContext = { client, locale, requireLocale, beginCartOperation, newId, newOrderToken };

  function cart(scope: ArkyCartScope): CartStore {
    requireId(scope.catalog_id, "catalog");
    const key = cartScopeKey(scope);
    const existing = cartStores.get(key);
    if (existing) return existing;
    const { store, invalidate } = createCartStore(cartContext, { buyer: scope.buyer, catalog_id: scope.catalog_id });
    cartStores.set(key, store);
    contextInvalidators.add(invalidate);
    return store;
  }

  function checkoutFlow(scope: ArkyCartScope): CheckoutFlow {
    const key = cartScopeKey(scope);
    const existing = checkoutFlows.get(key);
    if (existing) return existing;
    const { flow, invalidate } = createCheckoutFlow({ client, loadSetup, beginCartOperation, newId, newOrderToken }, cart(scope));
    checkoutFlows.set(key, flow);
    contextInvalidators.add(invalidate);
    return flow;
  }

  function bookingCalendar(scope: ArkyCartScope): BookingCalendar {
    const key = cartScopeKey(scope);
    const existing = bookingCalendars.get(key);
    if (existing) return existing;
    const calendar = createBookingCalendar({ client, locale, requireLocale }, cart(scope));
    bookingCalendars.set(key, calendar);
    return calendar;
  }

  return {
    client,
    session,
    setup,
    market,
    market_key,
    locale,
    currency,
    allowed_payment_option_ids,
    onAuthStateChanged: client.onAuthStateChanged,
    get hasSession() {
      return client.hasSession;
    },
    get isAuthenticated() {
      return client.isAuthenticated;
    },
    getSetup: client.getSetup,
    setContext,
    getMarket: () => market_key.get(),
    getLocale: () => locale.get(),
    customer: client.customer,
    newsletter: client.newsletter,
    broadcast: client.broadcast,
    store: {
      ...client.store,
      load: loadSetup,
    },
    media: client.media,
    content: client.content,
    forms: client.forms,
    category: client.category,
    eshop: {
      ...client.eshop,
      cart,
      checkoutFlow,
      bookingCalendar,
    },
    companies: client.companies,
    actions: client.actions,
    experiments: client.experiments,
    pageViews: client.pageViews,
    support: client.support,
  };
}

export type ArkyStore = ReturnType<typeof initializeStoreCore>;

export function initialize(publishableKey: string, options: ArkyStoreConfig): ArkyStore {
  return initializeStoreCore(publishableKey, options);
}

export type ArkyCartStore = CartStore;
export type ArkyCheckoutFlow = CheckoutFlow;
export type ArkyBookingCalendar = BookingCalendar;

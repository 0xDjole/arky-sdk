import { isCheckoutContactName } from "../services/cartCheckout";
import type { OrderContactName } from "../types/order";
import { atom, computed } from "nanostores";
import type {
  StorefrontCart,
  CartDeliveryDestination,
  StorefrontCartQuote,
  StorefrontCheckoutAcceptance,
  CheckoutPaymentChoice,
  CheckoutSavePaymentMethod,
  QuoteBlocker,
} from "../types/cart";
import { ArkyApiError, ArkyError, ArkyNetworkError } from "../types/apiError";
import { CartPresentationChangedError } from "../types/cartCheckout";
import { CartError } from "../types/cartSelection";
import type { EmailContact } from "../types/common";
import type { StorefrontPayment } from "../types/payment";
import type { StorefrontClient } from "../index";
import { DurableRequestError, isDefiniteRefusal } from "../utils/durableRequest";
import { latestPayment, paymentOutcome } from "../utils/paymentOutcome";
import type { CartScope, CartStore } from "./cart";
import type {
  ArkyCartQuoteParams,
  ArkyCheckoutErrorCode,
  ArkyCheckoutPlaceParams,
  ArkyCheckoutShipToParams,
  ArkyCheckoutState,
  ArkyCheckoutStep,
  ArkyOpenOrderParams,
  ArkyPlacedCheckout,
  ArkySelectPaymentOptionParams,
  ArkySelectShippingParams,
  ArkySetBillingAddressParams,
  ArkySetContactParams,
  ArkySetPlaceOfSaleParams,
  ArkySetPromotionCodesParams,
} from "./types";

const checkoutErrorBrand = Symbol.for("arky.commerce.CheckoutFlowError");

export class CheckoutFlowError extends ArkyError {
  readonly name: string = "CheckoutFlowError";
  readonly [checkoutErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && checkoutErrorBrand in value;
  }

  constructor(
    readonly code: ArkyCheckoutErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(code, message);
  }
}

export interface CheckoutFlowContext {
  client: StorefrontClient;
  loadSetup(): Promise<unknown>;
  beginCartOperation(): Promise<CartScope>;
  appId(label: string): string;
  appOrderToken(): string;
}

interface CheckoutLocal {
  busy: boolean;
  contact_email: EmailContact | null;
  contact_name: OrderContactName | null;
  payment_option_id: string | null;
  pending: ArkyCheckoutState["pending"];
  placed: ArkyPlacedCheckout | null;
  payment: StorefrontPayment | null;
  error: ArkyCheckoutState["error"];
}

type BlockerStep = Extract<ArkyCheckoutStep, "cart" | "details" | "shipping">;

const blockerSteps: Record<QuoteBlocker["type"], BlockerStep> = {
  units_without_delivery: "details",
  billing_address_required: "details",
  shipping_required: "shipping",
  booking_unavailable: "cart",
  booking_session: "cart",
  tax_unavailable: "cart",
  delivery_unavailable: "details",
  package_delivery_required: "details",
  package_shipping_required: "shipping",
  package_delivery_fee_varies: "shipping",
  package_minimum_conflict: "cart",
  package_change_scheduled: "cart",
  package_change_refused: "cart",
  payment_unavailable: "cart",
  purchase_order_number_required: "details",
  shipping_rate_unavailable: "shipping",
  package_shipping_rate_unavailable: "shipping",
  place_of_sale_required: "details",
  place_of_sale_not_active: "details",
  place_of_sale_jurisdiction: "cart",
  delivery_place_of_sale_jurisdiction: "details",
  document_unavailable: "cart",
  package_document_unavailable: "cart",
  delivery_document_unavailable: "details",
  documents_unavailable: "cart",
  fiscal_buyer_tax_id_required: "details",
};

function blockerStep(blocker: QuoteBlocker): BlockerStep {
  return Object.prototype.hasOwnProperty.call(blockerSteps, blocker.type) ? blockerSteps[blocker.type] : "cart";
}

const placedOutcomes = ["paid", "unconfirmed"];

const initialLocal: CheckoutLocal = {
  busy: false,
  contact_email: null,
  contact_name: null,
  payment_option_id: null,
  pending: null,
  placed: null,
  payment: null,
  error: null,
};

function stepOf(cart: StorefrontCart | null, quote: StorefrontCartQuote | null, local: CheckoutLocal): ArkyCheckoutStep {
  if (local.placed) return finished(local) ? "placed" : "paying";
  if (local.pending) return "paying";
  if (!cart || cart.line_items.length === 0) return "cart";
  const reviewed = quote !== null && quote.cart_id === cart.id ? quote : null;
  if (reviewed?.blockers.some((blocker) => blockerStep(blocker) === "cart")) return "cart";
  if (!reviewed || local.contact_email === null) return "details";
  if (reviewed.blockers.some((blocker) => blockerStep(blocker) === "details")) return "details";
  if (!reviewed.ready) return "shipping";
  return "payment";
}

function finished(local: CheckoutLocal): boolean {
  if (!local.placed) return false;
  if (local.placed.payment_id === null) return true;
  const outcome = local.payment ? paymentOutcome(local.payment) : null;
  return outcome !== null && placedOutcomes.includes(outcome);
}

function quoteSavesCard(quote: StorefrontCartQuote): boolean {
  return quote.lines.some((line) => line.type === "package" && line.saves_card);
}

const durableFailures: Record<DurableRequestError["code"], ArkyCheckoutErrorCode> = {
  storage: "unavailable",
  busy: "busy",
  pending: "pending",
  answer_mismatch: "interrupted",
  settled_elsewhere: "interrupted",
};

const cartFailures: Record<CartError["code"], ArkyCheckoutErrorCode> = {
  context_changed: "interrupted",
  other_cart: "failed",
  no_cart: "not_ready",
  not_ready: "not_ready",
  answer_mismatch: "interrupted",
  busy: "busy",
  storage: "unavailable",
  no_session: "not_ready",
};

function destinationOf(cart: StorefrontCart): CartDeliveryDestination | null {
  return cart.delivery_groups[0]?.destination ?? null;
}

export function createCheckoutFlow(context: CheckoutFlowContext, cart: CartStore) {
  const { client } = context;
  const local = atom<CheckoutLocal>({ ...initialLocal });

  function invalidate(): void {
    local.set({ ...initialLocal });
  }

  const state = computed([cart.cart, cart.quote_result, local], (currentCart, currentQuote, current): ArkyCheckoutState => ({
    step: stepOf(currentCart, currentQuote, current),
    busy: current.busy,
    cart: currentCart,
    quote: currentQuote,
    contact_email: current.contact_email,
    contact_name: current.contact_name,
    destination: currentCart ? destinationOf(currentCart) : null,
    billing_address: currentCart?.billing_address ?? null,
    payment_option_id: current.payment_option_id,
    pending: current.pending,
    placed: current.placed,
    payment: current.payment,
    outcome: current.payment ? paymentOutcome(current.payment) : null,
    error: current.error,
  }));

  function patch(values: Partial<CheckoutLocal>): void {
    local.set({ ...local.get(), ...values });
  }

  function failure(error: unknown): CheckoutFlowError {
    if (error instanceof CheckoutFlowError) return error;
    const message = error instanceof Error && error.message ? error.message : "The checkout step failed";
    if (error instanceof CartPresentationChangedError) {
      cart.quote_result.set(error.quote);
      return new CheckoutFlowError("presentation_changed", message, error);
    }
    if (error instanceof DurableRequestError) return new CheckoutFlowError(durableFailures[error.code], message, error);
    if (error instanceof CartError) return new CheckoutFlowError(cartFailures[error.code], message, error);
    if (isDefiniteRefusal(error)) return new CheckoutFlowError("refused", message, error);
    if (error instanceof ArkyApiError || error instanceof ArkyNetworkError) {
      return new CheckoutFlowError("interrupted", message, error);
    }
    return new CheckoutFlowError("failed", message, error);
  }

  async function step<T>(work: (operation: CartScope) => Promise<T>): Promise<T> {
    let operation: CartScope;
    try {
      operation = await context.beginCartOperation();
      operation.assertCurrent();
    } catch (error) {
      throw failure(error);
    }
    if (local.get().busy) throw new CheckoutFlowError("busy", "A checkout step is already running");
    patch({ busy: true, error: null });
    try {
      const result = await work(operation);
      operation.assertCurrent();
      return result;
    } catch (error) {
      if (!operation.isCurrent()) {
        throw new CheckoutFlowError("interrupted", "The buyer or the store context changed during checkout", error);
      }
      const failed = failure(error);
      patch({ error: { code: failed.code, message: failed.message } });
      throw failed;
    } finally {
      if (operation.isCurrent()) patch({ busy: false });
    }
  }

  function contact(): ArkyCartQuoteParams {
    const current = local.get().contact_email;
    return current === null ? {} : { contact_email: current.email };
  }

  function contactNames(): { contact_name: OrderContactName | null } {
    return { contact_name: local.get().contact_name };
  }

  async function quote(operation: CartScope): Promise<StorefrontCartQuote | null> {
    operation.assertCurrent();
    const current = cart.cart.get();
    if (!current || current.line_items.length === 0) {
      cart.quote_result.set(null);
      return null;
    }
    const quoted = await cart.quote(contact());
    operation.assertCurrent();
    const chosen = local.get().payment_option_id;
    if (chosen !== null && !quoted.payment_option_ids.includes(chosen)) patch({ payment_option_id: null });
    if (local.get().payment_option_id === null && quoted.suggested_payment_option_id !== null) {
      patch({ payment_option_id: quoted.suggested_payment_option_id });
    }
    return quoted;
  }

  function orderToken(orderId: string) {
    return { order_token: client.eshop.order.retainedToken({ order_id: orderId }) };
  }

  async function readPayment(operation: CartScope, placed: ArkyPlacedCheckout): Promise<StorefrontPayment | null> {
    operation.assertCurrent();
    if (placed.payment_id === null) return null;
    const payment = await client.eshop.order.getPayment(
      { order_id: placed.order_id, payment_id: placed.payment_id },
      orderToken(placed.order_id),
    );
    operation.assertCurrent();
    if (payment.id !== placed.payment_id || payment.order_id !== placed.order_id) {
      throw new CheckoutFlowError("interrupted", "The payment read answered another payment");
    }
    return payment;
  }

  async function accepted(operation: CartScope, result: StorefrontCheckoutAcceptance, orderId: string): Promise<ArkyCheckoutState> {
    operation.assertCurrent();
    if (result.type !== "placed") {
      patch({ pending: null, placed: null, payment: null });
      throw new CheckoutFlowError("refused", "The buyer already holds this sign-up; no order was placed");
    }
    if (result.order_id !== orderId) throw new CheckoutFlowError("interrupted", "The checkout answered another order");
    const placed: ArkyPlacedCheckout = {
      order_id: result.order_id,
      number: result.number,
      payment_id: result.payment_id,
      payment_action: result.payment_action,
      payment_method_id: result.payment_method_id,
      payment_method_setup: result.payment_method_setup,
    };
    patch({ pending: null, placed, payment: null });
    if (placed.payment_id !== null && placed.payment_action.type === "none") {
      const payment = await readPayment(operation, placed);
      operation.assertCurrent();
      patch({ payment });
    }
    return state.get();
  }

  async function pendingRequest(operation: CartScope) {
    operation.assertCurrent();
    const pending = await cart.pendingCheckout();
    operation.assertCurrent();
    patch({ pending });
    return pending;
  }

  async function recoverKept(operation: CartScope): Promise<StorefrontCheckoutAcceptance | null> {
    operation.assertCurrent();
    try {
      const result = await cart.recoverCheckout();
      operation.assertCurrent();
      return result;
    } catch (error) {
      if (operation.isCurrent()) await pendingRequest(operation);
      throw error;
    }
  }

  function savedCard(current: StorefrontCartQuote, params: ArkyCheckoutPlaceParams): CheckoutSavePaymentMethod {
    const required = quoteSavesCard(current);
    if (required && params.save_payment_method === false) {
      throw new CheckoutFlowError("not_ready", "This order saves the buyer's card, as the quote's saves_card says; it can't be placed without it");
    }
    if (!required && params.save_payment_method !== true) return { type: "dont_save" };
    const terms = params.payment_method_terms?.trim();
    if (!terms) {
      throw new CheckoutFlowError("not_ready", "Saving the card needs payment_method_terms: the card wording the buyer accepted");
    }
    return { type: "save", terms: params.payment_method_terms as string };
  }

  function paymentChoice(current: StorefrontCartQuote, params: ArkyCheckoutPlaceParams): CheckoutPaymentChoice {
    const save = savedCard(current, params);
    if (current.totals.total === 0 && save.type === "dont_save") return { type: "free" };
    const paymentOptionId = local.get().payment_option_id;
    if (paymentOptionId === null || !current.payment_option_ids.includes(paymentOptionId)) {
      throw new CheckoutFlowError("not_ready", "Choose one of the quote's payment options first");
    }
    return { type: "payment_option", payment_option_id: paymentOptionId, return_url: null, save_payment_method: save };
  }

  function withReturnUrl(payment: CheckoutPaymentChoice, orderId: string, params: ArkyCheckoutPlaceParams): CheckoutPaymentChoice {
    if (payment.type !== "payment_option") return payment;
    const returnUrl = typeof params.return_url === "function" ? params.return_url(orderId) : (params.return_url ?? null);
    return { ...payment, return_url: returnUrl };
  }

  const flow = {
    state,
    cart,

    open(): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        if (finished(local.get())) patch({ placed: null, payment: null });
        await context.loadSetup();
        if (await pendingRequest(operation)) return state.get();
        const current = await cart.load();
        operation.assertCurrent();
        if (current) await quote(operation);
        return state.get();
      });
    },

    reset(): ArkyCheckoutState {
      const current = local.get();
      if (current.busy) throw new CheckoutFlowError("busy", "A checkout step is still running");
      local.set({ ...initialLocal, contact_email: current.contact_email, contact_name: current.contact_name });
      return state.get();
    },

    setContact(params: ArkySetContactParams): void {
      const email = params.contact_email.email.trim();
      const language = params.contact_email.language.trim();
      if (!email) throw new CheckoutFlowError("not_ready", "The contact email is empty");
      if (!language) throw new CheckoutFlowError("not_ready", "The contact language is empty");
      if (!isCheckoutContactName(params.contact_name)) throw new CheckoutFlowError("not_ready", "A contact name needs both first and last name");
      patch({
        contact_email: { email, language },
        contact_name: params.contact_name ? { ...params.contact_name } : null,
        error: null,
      });
    },

    shipTo(params: ArkyCheckoutShipToParams): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        await cart.shipTo({ destination: params.destination, ...contact() });
        operation.assertCurrent();
        await quote(operation);
        return state.get();
      });
    },

    setPlaceOfSale(params: ArkySetPlaceOfSaleParams): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        await cart.setPlaceOfSale(params);
        await quote(operation);
        return state.get();
      });
    },

    setBillingAddress(params: ArkySetBillingAddressParams): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        await cart.setBillingAddress(params);
        await quote(operation);
        return state.get();
      });
    },

    selectShipping(params: ArkySelectShippingParams): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        const current = cart.cart.get();
        const reviewed = cart.quote_result.get();
        const delivery = reviewed?.deliveries.find((item) => item.delivery_group_id === params.delivery_group_id);
        if (
          !current ||
          !reviewed ||
          reviewed.cart_id !== current.id ||
          !delivery?.offers.some((offer) => offer.rate_id === params.rate_id && offer.shipping_method_id === params.shipping_method_id) ||
          !current.delivery_groups.some((group) => group.id === params.delivery_group_id)
        ) {
          throw new CheckoutFlowError("not_ready", "Choose one of the quoted offers for that delivery");
        }
        await cart.setDeliveryGroups({
          delivery_groups: current.delivery_groups.map((group) =>
            group.id === params.delivery_group_id
              ? { ...group, shipping: { shipping_method_id: params.shipping_method_id, rate_id: params.rate_id } }
              : group,
          ),
        });
        await quote(operation);
        return state.get();
      });
    },

    selectPaymentOption(params: ArkySelectPaymentOptionParams): void {
      const reviewed = cart.quote_result.get();
      if (!reviewed || !reviewed.payment_option_ids.includes(params.payment_option_id)) {
        throw new CheckoutFlowError("not_ready", "Choose one of the quote's payment options");
      }
      patch({ payment_option_id: params.payment_option_id, error: null });
    },

    setPromotionCodes(params: ArkySetPromotionCodesParams): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        await cart.setPromotionCodes(params);
        await quote(operation);
        return state.get();
      });
    },

    refresh(): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        await quote(operation);
        return state.get();
      });
    },

    place(params: ArkyCheckoutPlaceParams = {}): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        if (await pendingRequest(operation)) {
          throw new CheckoutFlowError("pending", "A checkout is still unfinished; recover it first");
        }
        const current = cart.cart.get();
        const reviewed = cart.quote_result.get();
        if (!current || !reviewed || reviewed.cart_id !== current.id || !reviewed.ready) {
          throw new CheckoutFlowError("not_ready", "The quote isn't ready to order");
        }
        const contactEmail = local.get().contact_email;
        if (contactEmail === null) throw new CheckoutFlowError("not_ready", "Add the contact email first");
        const chosen = paymentChoice(reviewed, params);
        const orderId = context.appId("order");
        await cart.retainCheckout({
          order_id: orderId,
          order_token: context.appOrderToken(),
          contact_email: contactEmail,
          ...contactNames(),
          payment: withReturnUrl(chosen, orderId, params),
        });
        const result = await recoverKept(operation);
        if (!result) throw new CheckoutFlowError("interrupted", "The kept checkout was settled elsewhere; read the order");
        return accepted(operation, result, orderId);
      });
    },

    recover(): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        const pending = await pendingRequest(operation);
        if (!pending) return state.get();
        const result = await recoverKept(operation);
        if (!result) {
          await pendingRequest(operation);
          return state.get();
        }
        return accepted(operation, result, pending.order_id);
      });
    },

    resumePayment(): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        const placed = local.get().placed;
        if (!placed) throw new CheckoutFlowError("not_ready", "No placed order waits for its payment");
        const action = await client.eshop.order.resumePayment({ order_id: placed.order_id }, orderToken(placed.order_id));
        operation.assertCurrent();
        patch({ placed: { ...placed, payment_action: action } });
        if (action.type === "none") {
          const payment = await readPayment(operation, placed);
          operation.assertCurrent();
          patch({ payment });
        }
        return state.get();
      });
    },

    refreshPayment(): Promise<ArkyCheckoutState> {
      return step(async (operation) => {
        const placed = local.get().placed;
        if (!placed) throw new CheckoutFlowError("not_ready", "No placed order waits for its payment");
        const payment = await readPayment(operation, placed);
        operation.assertCurrent();
        patch({ payment });
        return state.get();
      });
    },

    openOrder(params: ArkyOpenOrderParams): Promise<{ state: ArkyCheckoutState; url: string }> {
      return step(async (operation) => {
        const opened = await client.eshop.order.fromLink({ id: params.order_id, url: params.url });
        operation.assertCurrent();
        const payments = await client.eshop.order.findPayments({ order_id: opened.order.id }, { order_token: opened.order_token });
        operation.assertCurrent();
        if (payments.some((payment) => payment.order_id !== opened.order.id)) {
          throw new CheckoutFlowError("interrupted", "The payment list answered another order");
        }
        const payment = latestPayment(payments);
        patch({
          pending: null,
          placed: {
            order_id: opened.order.id,
            number: opened.order.number,
            payment_id: payment?.id ?? null,
            payment_action: { type: "none" },
            payment_method_id: null,
            payment_method_setup: null,
          },
          payment,
        });
        return { state: state.get(), url: opened.url };
      });
    },
  };
  return { flow, invalidate };
}

export type CheckoutFlow = ReturnType<typeof createCheckoutFlow>["flow"];

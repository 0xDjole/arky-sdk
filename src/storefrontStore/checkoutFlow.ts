import { atom, computed } from "nanostores";
import type {
  Cart,
  CartDeliveryDestination,
  CartQuote,
  CartShipping,
  CheckoutAcceptance,
  CheckoutPaymentChoice,
  QuoteBlocker,
} from "../types/cart";
import { ArkyApiError } from "../types/apiError";
import { CartPresentationChangedError } from "../types/cartCheckout";
import type { PostalAddress } from "../types/common";
import type { Payment } from "../types/payment";
import type { StorefrontClient } from "../index";
import { DurableRequestStorageError, isDefiniteRefusal } from "../utils/durableRequest";
import { latestPayment, paymentOutcome } from "../utils/paymentOutcome";
import type { CartStore } from "./cart";
import type {
  ArkyCheckoutErrorCode,
  ArkyCheckoutPlaceParams,
  ArkyCheckoutResumeParams,
  ArkyCheckoutState,
  ArkyCheckoutStep,
  ArkyPlacedCheckout,
} from "./types";

const checkoutErrorBrand = Symbol.for("arky.commerce.CheckoutFlowError");

export class CheckoutFlowError extends Error {
  readonly name = "CheckoutFlowError";
  readonly [checkoutErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && checkoutErrorBrand in value;
  }

  constructor(
    readonly code: ArkyCheckoutErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export interface CheckoutFlowContext {
  client: StorefrontClient;
  loadSetup(): Promise<unknown>;
  newId(label: string): string;
  newOrderToken(): string;
}

interface CheckoutLocal {
  busy: boolean;
  contact_email: string | null;
  destination: CartDeliveryDestination | null;
  payment_option_id: string | null;
  pending: ArkyCheckoutState["pending"];
  placed: ArkyPlacedCheckout | null;
  payment: Payment | null;
  error: ArkyCheckoutState["error"];
}

const detailBlockers: QuoteBlocker["type"][] = [
  "units_without_delivery",
  "billing_address_required",
  "purchase_order_number_required",
  "customer_group_delivery_required",
];

function stepOf(cart: Cart | null, quote: CartQuote | null, local: CheckoutLocal): ArkyCheckoutStep {
  if (local.placed) {
    if (local.placed.payment_id === null) return "placed";
    const outcome = local.payment ? paymentOutcome(local.payment) : null;
    return outcome === "paid" || outcome === "pay_later" ? "placed" : "paying";
  }
  if (local.pending) return "paying";
  if (!cart || cart.line_items.length === 0) return "cart";
  if (!quote || quote.cart_id !== cart.id || local.contact_email === null) return "details";
  if (quote.blockers.some((blocker) => detailBlockers.includes(blocker.type))) return "details";
  if (!quote.ready) return "shipping";
  return "payment";
}

function destinationOf(cart: Cart): CartDeliveryDestination | null {
  return cart.delivery_groups[0]?.destination ?? null;
}

export function createCheckoutFlow(context: CheckoutFlowContext, cart: CartStore) {
  const { client } = context;
  const local = atom<CheckoutLocal>({
    busy: false,
    contact_email: null,
    destination: null,
    payment_option_id: null,
    pending: null,
    placed: null,
    payment: null,
    error: null,
  });

  const state = computed([cart.cart, cart.quote_result, local], (currentCart, currentQuote, current): ArkyCheckoutState => ({
    step: stepOf(currentCart, currentQuote, current),
    busy: current.busy,
    cart: currentCart,
    quote: currentQuote,
    contact_email: current.contact_email,
    destination: current.destination,
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
    if (error instanceof DurableRequestStorageError) return new CheckoutFlowError("unavailable", message, error);
    if (isDefiniteRefusal(error)) return new CheckoutFlowError("refused", message, error);
    if (
      error instanceof ArkyApiError ||
      (error instanceof Error && ["NetworkError", "AbortError", "ParseError"].includes(error.name))
    ) {
      return new CheckoutFlowError("interrupted", message, error);
    }
    return new CheckoutFlowError("failed", message, error);
  }

  async function step<T>(work: () => Promise<T>): Promise<T> {
    if (local.get().busy) throw new CheckoutFlowError("busy", "A checkout step is already running");
    patch({ busy: true, error: null });
    try {
      return await work();
    } catch (error) {
      const failed = failure(error);
      patch({ error: { code: failed.code, message: failed.message } });
      throw failed;
    } finally {
      patch({ busy: false });
    }
  }

  async function quote(): Promise<CartQuote | null> {
    const current = cart.cart.get();
    if (!current || current.line_items.length === 0) {
      cart.quote_result.set(null);
      return null;
    }
    const quoted = await cart.quote();
    const chosen = local.get().payment_option_id;
    if (chosen !== null && !quoted.payment_option_ids.includes(chosen)) patch({ payment_option_id: null });
    if (local.get().payment_option_id === null && quoted.suggested_payment_option_id !== null) {
      patch({ payment_option_id: quoted.suggested_payment_option_id });
    }
    return quoted;
  }

  function orderToken(orderId: string) {
    const token = client.eshop.order.retainedToken(orderId);
    return token ? { order_token: token } : undefined;
  }

  async function readPayment(placed: ArkyPlacedCheckout): Promise<Payment | null> {
    if (placed.payment_id === null) return null;
    const payment = await client.eshop.order.getPayment(
      { order_id: placed.order_id, payment_id: placed.payment_id },
      orderToken(placed.order_id),
    );
    if (payment.id !== placed.payment_id || payment.order_id !== placed.order_id) {
      throw new CheckoutFlowError("interrupted", "The payment read answered another payment");
    }
    return payment;
  }

  async function accepted(result: CheckoutAcceptance, orderId: string): Promise<ArkyCheckoutState> {
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
    };
    patch({ pending: null, placed, payment: null });
    if (placed.payment_id !== null && placed.payment_action.type === "none") patch({ payment: await readPayment(placed) });
    return state.get();
  }

  async function pendingRequest() {
    const pending = await cart.pendingCheckout();
    patch({ pending });
    return pending;
  }

  async function recoverKept(): Promise<CheckoutAcceptance | null> {
    try {
      return await cart.recoverCheckout();
    } catch (error) {
      await pendingRequest();
      throw error;
    }
  }

  function paymentChoice(current: CartQuote, orderId: string, params: ArkyCheckoutPlaceParams): CheckoutPaymentChoice {
    if (current.totals.total === 0) return { type: "free" };
    const paymentOptionId = local.get().payment_option_id;
    if (paymentOptionId === null || !current.payment_option_ids.includes(paymentOptionId)) {
      throw new CheckoutFlowError("not_ready", "Choose one of the quote's payment options first");
    }
    const returnUrl = typeof params.return_url === "function" ? params.return_url(orderId) : (params.return_url ?? null);
    const saveCard = params.save_payment_method === true;
    return {
      type: "payment_option",
      payment_option_id: paymentOptionId,
      return_url: returnUrl,
      save_payment_method: saveCard,
      payment_method_terms: saveCard ? (params.payment_method_terms ?? null) : null,
    };
  }

  return {
    state,
    cart,

    open(): Promise<ArkyCheckoutState> {
      return step(async () => {
        await context.loadSetup();
        if (await pendingRequest()) return state.get();
        const current = await cart.load();
        if (current) {
          const customer = client.session?.customer;
          const signedIn = customer?.type.type === "verified" ? customer.type.email : null;
          patch({
            destination: destinationOf(current),
            contact_email: local.get().contact_email ?? current.billing_address?.email ?? signedIn,
          });
          await quote();
        }
        return state.get();
      });
    },

    setContact(email: string): void {
      const value = email.trim();
      if (!value) throw new CheckoutFlowError("not_ready", "The contact email is empty");
      patch({ contact_email: value, error: null });
    },

    shipTo(destination: CartDeliveryDestination): Promise<ArkyCheckoutState> {
      return step(async () => {
        await cart.shipTo(destination);
        patch({ destination });
        await quote();
        return state.get();
      });
    },

    setBillingAddress(address: PostalAddress | null): Promise<ArkyCheckoutState> {
      return step(async () => {
        await cart.setBillingAddress(address);
        await quote();
        return state.get();
      });
    },

    chooseShipping(deliveryGroupId: string, shipping: CartShipping): Promise<ArkyCheckoutState> {
      return step(async () => {
        const current = cart.cart.get();
        const reviewed = cart.quote_result.get();
        const delivery = reviewed?.deliveries.find((item) => item.delivery_group_id === deliveryGroupId);
        if (
          !current ||
          !reviewed ||
          reviewed.cart_id !== current.id ||
          !delivery?.offers.some((offer) => offer.rate_id === shipping.rate_id && offer.shipping_method_id === shipping.shipping_method_id) ||
          !current.delivery_groups.some((group) => group.id === deliveryGroupId)
        ) {
          throw new CheckoutFlowError("not_ready", "Choose one of the quoted offers for that delivery");
        }
        await cart.setDeliveryGroups(
          current.delivery_groups.map((group) =>
            group.id === deliveryGroupId
              ? { ...group, shipping: { shipping_method_id: shipping.shipping_method_id, rate_id: shipping.rate_id } }
              : group,
          ),
        );
        await quote();
        return state.get();
      });
    },

    choosePayment(paymentOptionId: string): void {
      const reviewed = cart.quote_result.get();
      if (!reviewed || !reviewed.payment_option_ids.includes(paymentOptionId)) {
        throw new CheckoutFlowError("not_ready", "Choose one of the quote's payment options");
      }
      patch({ payment_option_id: paymentOptionId, error: null });
    },

    setPromotionCodes(codes: string[]): Promise<ArkyCheckoutState> {
      return step(async () => {
        await cart.setPromotionCodes(codes);
        await quote();
        return state.get();
      });
    },

    refresh(): Promise<ArkyCheckoutState> {
      return step(async () => {
        await quote();
        return state.get();
      });
    },

    place(params: ArkyCheckoutPlaceParams = {}): Promise<ArkyCheckoutState> {
      return step(async () => {
        if (await pendingRequest()) {
          throw new CheckoutFlowError("pending", "A checkout is still unfinished; recover it first");
        }
        const current = cart.cart.get();
        const reviewed = cart.quote_result.get();
        if (!current || !reviewed || reviewed.cart_id !== current.id || !reviewed.ready) {
          throw new CheckoutFlowError("not_ready", "The quote isn't ready to order");
        }
        const contactEmail = local.get().contact_email;
        if (contactEmail === null) throw new CheckoutFlowError("not_ready", "Add the contact email first");
        const orderId = context.newId("order");
        const payment = paymentChoice(reviewed, orderId, params);
        await cart.retainCheckout({ order_id: orderId, order_token: context.newOrderToken(), contact_email: contactEmail, payment });
        const result = await recoverKept();
        if (!result) throw new CheckoutFlowError("interrupted", "The kept checkout was settled elsewhere; read the order");
        return accepted(result, orderId);
      });
    },

    recover(): Promise<ArkyCheckoutState> {
      return step(async () => {
        const pending = await pendingRequest();
        if (!pending) return state.get();
        const result = await recoverKept();
        if (!result) {
          await pendingRequest();
          return state.get();
        }
        return accepted(result, pending.order_id);
      });
    },

    resumePayment(): Promise<ArkyCheckoutState> {
      return step(async () => {
        const placed = local.get().placed;
        if (!placed) throw new CheckoutFlowError("not_ready", "No placed order waits for its payment");
        const action = await client.eshop.order.paymentAction({ order_id: placed.order_id }, orderToken(placed.order_id));
        patch({ placed: { ...placed, payment_action: action } });
        if (action.type === "none") patch({ payment: await readPayment(placed) });
        return state.get();
      });
    },

    refreshPayment(): Promise<ArkyCheckoutState> {
      return step(async () => {
        const placed = local.get().placed;
        if (!placed) throw new CheckoutFlowError("not_ready", "No placed order waits for its payment");
        patch({ payment: await readPayment(placed) });
        return state.get();
      });
    },

    resume(params: ArkyCheckoutResumeParams): Promise<{ state: ArkyCheckoutState; url: string }> {
      return step(async () => {
        const opened = await client.eshop.order.fromLink({ id: params.order_id, url: params.url });
        const payments = await client.eshop.order.findPayments({ order_id: opened.order.id }, orderToken(opened.order.id));
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
          },
          payment,
        });
        return { state: state.get(), url: opened.url };
      });
    },
  };
}

export type CheckoutFlow = ReturnType<typeof createCheckoutFlow>;

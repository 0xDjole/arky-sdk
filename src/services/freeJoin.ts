import type { RequestOptions } from "../types/httpClient";
import type {
  Cart,
  CartQuote,
  CheckoutAcceptance,
  CreatedCart,
  StorefrontAddCartCustomerGroupParams,
  StorefrontCreateCartParams,
} from "../types/cart";
import type { CartCheckoutRequest } from "../types/cartCheckout";
import type {
  GetStorefrontCustomerGroupByKeyParams,
  GetStorefrontCustomerGroupParams,
  StorefrontCustomerGroup,
} from "../types/customerGroup";
import {
  CustomerGroupJoinError,
  type JoinFreeCustomerGroupParams,
  type JoinFreeCustomerGroupResult,
} from "../types/customerGroupJoin";
import type { Order } from "../types/order";
import {
  clearDurableRequest,
  DurableRequestError,
  durableRequestPayload,
  getOrCreateDurableRequest,
  isDefiniteRefusal,
  readDurableRequest,
  withDurableRequestLock,
  type DurableRequest,
} from "../utils/durableRequest";
import { isCanonicalId, requireId } from "../utils/ids";
import { isOrderToken } from "../utils/orderToken";

export interface FreeJoinDeps {
  verifiedEmail(): string | null;
  pendingKey(flow: string, target: string): string;
  newId(label: string): string;
  newOrderToken(): string;
  retainToken(orderId: string, token: string): void;
  getGroup(
    params: GetStorefrontCustomerGroupParams | GetStorefrontCustomerGroupByKeyParams,
    options?: RequestOptions,
  ): Promise<StorefrontCustomerGroup>;
  createCart(params: StorefrontCreateCartParams, options?: RequestOptions): Promise<CreatedCart>;
  addGroupLine(params: StorefrontAddCartCustomerGroupParams, options?: RequestOptions): Promise<Cart>;
  quote(params: { id: string }, options?: RequestOptions): Promise<CartQuote>;
  accept(request: CartCheckoutRequest, options?: RequestOptions): Promise<CheckoutAcceptance>;
  getOrder(id: string, orderToken: string, options?: RequestOptions): Promise<Order>;
}

interface FreeJoinRequest {
  cart_id: string;
  line_item_id: string;
  order_id: string;
  order_token: string;
  catalog_id: string;
  customer_group_id: string;
}

const label = "free customer group sign-up";

function savedJoin(request: DurableRequest): FreeJoinRequest {
  const value = durableRequestPayload(request);
  const fields = value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  if (
    !fields ||
    Object.keys(fields).length !== 6 ||
    !isCanonicalId(fields.cart_id) ||
    !isCanonicalId(fields.line_item_id) ||
    !isCanonicalId(fields.order_id) ||
    !isOrderToken(fields.order_token) ||
    !isCanonicalId(fields.catalog_id) ||
    !isCanonicalId(fields.customer_group_id)
  ) {
    throw new DurableRequestError("storage", `The saved ${label} can't be read; nothing was sent`);
  }
  return {
    cart_id: fields.cart_id,
    line_item_id: fields.line_item_id,
    order_id: fields.order_id,
    order_token: fields.order_token,
    catalog_id: fields.catalog_id,
    customer_group_id: fields.customer_group_id,
  };
}

async function place(
  deps: FreeJoinDeps,
  request: FreeJoinRequest,
  email: string,
  options?: RequestOptions,
): Promise<JoinFreeCustomerGroupResult> {
  const created = await deps.createCart(
    { id: request.cart_id, buyer: { type: "customer" }, catalog_id: request.catalog_id },
    options,
  );
  let cart = created.cart;
  if (!cart || cart.id !== request.cart_id) throw new DurableRequestError("answer_mismatch", "The sign-up cart answer names another cart");
  if (cart.status.type === "converted") {
    const order = await deps.getOrder(request.order_id, request.order_token, options);
    if (order.id !== request.order_id || order.source.type !== "cart" || order.source.cart_id !== request.cart_id) {
      throw new CustomerGroupJoinError("sign_up_used", "The saved sign-up was used for another order; join again");
    }
    return { type: "joined", order_id: order.id };
  }
  if (cart.status.type !== "active" && cart.status.type !== "abandoned") {
    throw new CustomerGroupJoinError("sign_up_expired", "The saved sign-up expired; join again");
  }
  if (!cart.line_items.some((line) => line.id === request.line_item_id)) {
    cart = await deps.addGroupLine(
      {
        id: cart.id,
        expected_updated_at: cart.updated_at,
        customer_group: {
          id: request.line_item_id,
          customer_group_id: request.customer_group_id,
          quantity: 1,
          choices: [],
          start: { type: "on_acceptance" },
        },
      },
      options,
    );
  }
  const quote = await deps.quote({ id: cart.id }, options);
  if (quote.cart_id !== cart.id || !quote.ready || quote.totals.total !== 0 || quote.lines.length !== 1) {
    throw new CustomerGroupJoinError("not_free", "The sign-up isn't free right now; nothing was ordered");
  }
  const acceptance = await deps.accept(
    {
      order_token: request.order_token,
      order_id: request.order_id,
      cart_id: cart.id,
      expected_updated_at: cart.updated_at,
      presentation_digest: quote.presentation_digest,
      contact_email: email,
      payment: { type: "free" },
    },
    options,
  );
  if (acceptance.type === "already_member") {
    return { type: "already_member", customer_group_member_id: acceptance.customer_group_member_id };
  }
  if (acceptance.order_id !== request.order_id) throw new DurableRequestError("answer_mismatch", "The sign-up answer names another order");
  return { type: "joined", order_id: acceptance.order_id };
}

export async function joinFreeCustomerGroup(
  deps: FreeJoinDeps,
  params: JoinFreeCustomerGroupParams,
  options?: RequestOptions,
): Promise<JoinFreeCustomerGroupResult> {
  const email = deps.verifiedEmail();
  if (!email) {
    throw new CustomerGroupJoinError("sign_in_required", "Joining a free group needs a signed-in customer with a verified email");
  }
  const catalogId = requireId(params.catalog_id, "catalog");
  const identifier = "id" in params ? params.id : params.key;
  if (!identifier) throw new TypeError("A free sign-up names its customer group by id or by key");
  const group = await deps.getGroup(
    "id" in params
      ? { id: params.id, catalog_id: catalogId, include_price: true }
      : { key: params.key, catalog_id: catalogId, include_price: true },
    options,
  );
  if (group.term.type !== "permanent" || group.entitlements.length > 0 || group.price?.unit_price.amount !== 0) {
    throw new CustomerGroupJoinError("not_free", "This customer group isn't a free sign-up in this catalog");
  }
  const key = deps.pendingKey("free-join", group.id);
  return withDurableRequestLock(key, label, async () => {
    const saved = readDurableRequest(key, label);
    const savedRequest = saved ? savedJoin(saved) : null;
    let kept: { durable: DurableRequest; request: FreeJoinRequest } | null = null;
    if (saved && savedRequest && savedRequest.catalog_id === catalogId) kept = { durable: saved, request: savedRequest };
    else if (saved) clearDurableRequest(saved, label);
    if (!kept) {
      const request: FreeJoinRequest = {
        cart_id: deps.newId("cart"),
        line_item_id: deps.newId("cart line"),
        order_id: deps.newId("order"),
        order_token: deps.newOrderToken(),
        catalog_id: catalogId,
        customer_group_id: group.id,
      };
      kept = { durable: getOrCreateDurableRequest(key, request, label), request };
      deps.retainToken(request.order_id, request.order_token);
    }
    const { durable, request } = kept;
    let result: JoinFreeCustomerGroupResult;
    try {
      result = await place(deps, request, email, options);
    } catch (error) {
      if (isDefiniteRefusal(error) || error instanceof CustomerGroupJoinError) clearDurableRequest(durable, label);
      throw error;
    }
    clearDurableRequest(durable, label);
    return result;
  });
}

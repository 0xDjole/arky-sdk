import type { RequestOptions } from "../types/httpClient";
import { ArkyError } from "../types/apiError";
import type {
  FindStorefrontPackageItemPricesParams,
  GetStorefrontPackageByKeyParams,
  GetStorefrontPackageParams,
  PackagePriceRef,
  StorefrontPackage,
  StorefrontPackageItemPrice,
} from "../types/package";
import type { EmailContact, PaginatedResponse } from "../types/common";
import type {
  StorefrontCart,
  CartQuote,
  StorefrontCheckoutAcceptance,
  StorefrontCreatedCart,
  StorefrontAddCartPackageParams,
  StorefrontCreateCartParams,
} from "../types/cart";
import type { CartCheckoutRequest } from "../types/cartCheckout";
import {
  PackageJoinError,
  type JoinFreePackageParams,
  type JoinFreePackageResult,
} from "../types/packageJoin";
import type { StorefrontOrder } from "../types/order";
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
import { isRecord } from "../utils/record";

export interface FreeJoinDeps {
  verifiedContact(): EmailContact | null;
  pendingKey(flow: string, target: string): string;
  appId(label: string): string;
  appOrderToken(): string;
  retainToken(orderId: string, token: string): void;
  marketId(): Promise<string>;
  getPackage(
    params: GetStorefrontPackageParams | GetStorefrontPackageByKeyParams,
    options?: RequestOptions,
  ): Promise<StorefrontPackage>;
  findPrices(
    params: FindStorefrontPackageItemPricesParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<StorefrontPackageItemPrice>>;
  createCart(params: StorefrontCreateCartParams & { market_id: string }, options?: RequestOptions): Promise<StorefrontCreatedCart>;
  addPackageLine(params: StorefrontAddCartPackageParams, options?: RequestOptions): Promise<StorefrontCart>;
  quote(params: { id: string }, options?: RequestOptions): Promise<CartQuote>;
  accept(request: CartCheckoutRequest, options?: RequestOptions): Promise<StorefrontCheckoutAcceptance>;
  getOrder(id: string, orderToken: string, options?: RequestOptions): Promise<StorefrontOrder>;
}

interface FreeJoinRequest {
  cart_id: string;
  line_item_id: string;
  order_id: string;
  order_token: string;
  shop_package_id: string;
  market_id: string;
  joined_package_id: string;
}

const label = "free package sign-up";

function savedJoin(request: DurableRequest): FreeJoinRequest {
  const value = durableRequestPayload(request);
  const fields = isRecord(value) ? value : null;
  if (
    !fields ||
    Object.keys(fields).length !== 7 ||
    !isCanonicalId(fields.cart_id) ||
    !isCanonicalId(fields.line_item_id) ||
    !isCanonicalId(fields.order_id) ||
    !isOrderToken(fields.order_token) ||
    !isCanonicalId(fields.shop_package_id) ||
    !isCanonicalId(fields.market_id) ||
    !isCanonicalId(fields.joined_package_id)
  ) {
    throw new DurableRequestError("storage", `The saved ${label} can't be read; nothing was sent`);
  }
  return {
    cart_id: fields.cart_id,
    line_item_id: fields.line_item_id,
    order_id: fields.order_id,
    order_token: fields.order_token,
    shop_package_id: fields.shop_package_id,
    market_id: fields.market_id,
    joined_package_id: fields.joined_package_id,
  };
}

async function packagePrice(
  deps: FreeJoinDeps,
  joined: StorefrontPackage,
  shopPackageId: string,
  options?: RequestOptions,
): Promise<StorefrontPackageItemPrice> {
  let cursor: string | null = null;
  do {
    const page: PaginatedResponse<StorefrontPackageItemPrice> = await deps.findPrices(
      {
        package_item_id: joined.package_item_id,
        package_id: shopPackageId,
        include_price: true,
        ...(cursor === null ? {} : { cursor }),
      },
      options,
    );
    const choice = page.items.find(
      (item) => item.sellable.type === "package" && item.sellable.package_id === joined.id,
    );
    if (choice) return choice;
    if (page.cursor !== null && page.cursor === cursor) {
      throw new ArkyError("answer_mismatch", "The package's price page didn't advance");
    }
    cursor = page.cursor;
  } while (cursor !== null);
  throw new PackageJoinError("not_free", "This package has no price in this shop");
}

async function place(
  deps: FreeJoinDeps,
  request: FreeJoinRequest,
  price: PackagePriceRef,
  contact: EmailContact,
  options?: RequestOptions,
): Promise<JoinFreePackageResult> {
  const created = await deps.createCart(
    { id: request.cart_id, buyer: { type: "customer" }, package_id: request.shop_package_id, market_id: request.market_id },
    options,
  );
  let cart = created.cart;
  if (!cart || cart.id !== request.cart_id) throw new DurableRequestError("answer_mismatch", "The sign-up cart answer names another cart");
  if (cart.status.type === "converted") {
    const order = await deps.getOrder(request.order_id, request.order_token, options);
    if (order.id !== request.order_id || order.source.type !== "cart" || order.source.cart_id !== request.cart_id) {
      throw new PackageJoinError("sign_up_used", "The saved sign-up was used for another order; join again");
    }
    return { type: "joined", order_id: order.id };
  }
  if (cart.status.type !== "active" && cart.status.type !== "abandoned") {
    throw new PackageJoinError("sign_up_expired", "The saved sign-up expired; join again");
  }
  if (!cart.line_items.some((line) => line.id === request.line_item_id)) {
    cart = await deps.addPackageLine(
      {
        id: cart.id,
        expected_updated_at: cart.updated_at,
        package: {
          id: request.line_item_id,
          package_id: request.joined_package_id,
          quantity: 1,
          choices: [],
          start: { type: "on_acceptance" },
          price,
        },
      },
      options,
    );
  }
  const quote = await deps.quote({ id: cart.id }, options);
  if (quote.cart_id !== cart.id || !quote.ready || quote.totals.total !== 0 || quote.lines.length !== 1) {
    throw new PackageJoinError("not_free", "The sign-up isn't free right now; nothing was ordered");
  }
  const acceptance = await deps.accept(
    {
      order_token: request.order_token,
      order_id: request.order_id,
      cart_id: cart.id,
      expected_updated_at: cart.updated_at,
      presentation_digest: quote.presentation_digest,
      contact_email: { email: contact.email, language: contact.language },
      payment: { type: "free" },
    },
    options,
  );
  if (acceptance.type === "already_member") {
    return { type: "already_member", package_member_id: acceptance.package_member_id };
  }
  if (acceptance.order_id !== request.order_id) throw new DurableRequestError("answer_mismatch", "The sign-up answer names another order");
  return { type: "joined", order_id: acceptance.order_id };
}

export async function joinFreePackage(
  deps: FreeJoinDeps,
  params: JoinFreePackageParams,
  options?: RequestOptions,
): Promise<JoinFreePackageResult> {
  const verified = deps.verifiedContact();
  if (!verified) {
    throw new PackageJoinError("sign_in_required", "Joining a free package needs a signed-in customer with a verified email");
  }
  const contact: EmailContact = { email: verified.email, language: params.language };
  const shopPackageId = requireId(params.package_id, "package");
  const identifier = "id" in params ? params.id : params.key;
  if (!identifier) throw new TypeError("A free sign-up names its package by id or by key");
  const joined = await deps.getPackage(
    "id" in params ? { id: params.id, package_id: shopPackageId } : { key: params.key, package_id: shopPackageId },
    options,
  );
  if (joined.renewal.type !== "never" || joined.items.length > 0) {
    throw new PackageJoinError("not_free", "This package isn't a free sign-up in this shop");
  }
  const choice = await packagePrice(deps, joined, shopPackageId, options);
  if (!choice.price || choice.price.unit_price.amount !== 0) {
    throw new PackageJoinError("not_free", "This package isn't a free sign-up in this shop");
  }
  const price: PackagePriceRef = {
    package_id: choice.price.package_id,
    package_item_id: choice.price.package_item_id,
    price_id: choice.price.price_id,
  };
  const marketId = await deps.marketId();
  const key = deps.pendingKey("free-join", joined.id);
  return withDurableRequestLock(key, label, async () => {
    const saved = readDurableRequest(key, label);
    const savedRequest = saved ? savedJoin(saved) : null;
    let kept: { durable: DurableRequest; request: FreeJoinRequest } | null = null;
    if (saved && savedRequest && savedRequest.shop_package_id === shopPackageId && savedRequest.market_id === marketId) {
      kept = { durable: saved, request: savedRequest };
    } else if (saved) clearDurableRequest(saved, label);
    if (!kept) {
      const request: FreeJoinRequest = {
        cart_id: deps.appId("cart"),
        line_item_id: deps.appId("cart line"),
        order_id: deps.appId("order"),
        order_token: deps.appOrderToken(),
        shop_package_id: shopPackageId,
        market_id: marketId,
        joined_package_id: joined.id,
      };
      kept = { durable: getOrCreateDurableRequest(key, request, label), request };
      deps.retainToken(request.order_id, request.order_token);
    }
    const { durable, request } = kept;
    let result: JoinFreePackageResult;
    try {
      result = await place(deps, request, price, contact, options);
    } catch (error) {
      if (isDefiniteRefusal(error) || error instanceof PackageJoinError) clearDurableRequest(durable, label);
      throw error;
    }
    clearDurableRequest(durable, label);
    return result;
  });
}

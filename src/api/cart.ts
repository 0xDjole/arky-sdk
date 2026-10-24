import { isOrderToken } from "../utils/orderToken";
import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AddCartBookingParams,
  AddCartCustomerGroupParams,
  AddCartProductParams,
  Cart,
  CartAccessProductPreview,
  CartQuote,
  CheckoutAcceptance,
  CheckoutCartOnAccountParams,
  CheckoutCartParams,
  ClearCartParams,
  CreateCartOfferParams,
  CreateCartParams,
  CreatedCart,
  CustomerGroupDeliveryOffers,
  FindCartsParams,
  GetCartParams,
  GetCartOrderParams,
  PreviewCartAccessProductParams,
  QuoteCartFutureDeliveriesParams,
  QuoteCartOfferParams,
  QuoteCartParams,
  QuotePurchaseParams,
  RemoveCartItemParams,
  SelectCartShippingMethodParams,
  SendCartOfferParams,
  SetCartFutureDeliveriesParams,
  UpdateCartParams,
  WithdrawCartOfferParams,
} from "../types/cart";
import type { Order } from "../types/order";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "carts";

export const createCartApi = (apiConfig: ApiConfig) => {
  const cartPath = (storeId: string, id: string) => storeRecordPath(storeId, collection, id);
  const action = <T>(storeId: string, id: string, path: string, body: object, options?: RequestOptions) =>
    apiConfig.httpClient.post<T>(`${cartPath(storeId, id)}/${path}`, body, options);

  return {
    find(params: FindCartsParams, options?: RequestOptions): Promise<PaginatedResponse<Cart>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Cart>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetCartParams, options?: RequestOptions): Promise<Cart> {
      return apiConfig.httpClient.get<Cart>(cartPath(params.store_id, params.id), options);
    },

    getOrder(params: GetCartOrderParams, options?: RequestOptions): Promise<Order | null> {
      requireId(params.id, "cart");
      return apiConfig.httpClient.get<Order | null>(`${cartPath(params.store_id, params.id)}/order`, options);
    },

    create(params: CreateCartParams, options?: RequestOptions): Promise<CreatedCart> {
      requireId(params.id, "cart");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<CreatedCart>(storePath(store_id, collection), body, options);
    },

    update(params: UpdateCartParams, options?: RequestOptions): Promise<Cart> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<Cart>(cartPath(store_id, id), body, options);
    },

    addProduct(params: AddCartProductParams, options?: RequestOptions): Promise<Cart> {
      requireId(params.product.id, "cart line");
      const { store_id, id, ...body } = params;
      return action<Cart>(store_id, id, "product-items", body, options);
    },

    addBooking(params: AddCartBookingParams, options?: RequestOptions): Promise<Cart> {
      requireId(params.booking.id, "cart line");
      const { store_id, id, ...body } = params;
      return action<Cart>(store_id, id, "booking-items", body, options);
    },

    addCustomerGroup(params: AddCartCustomerGroupParams, options?: RequestOptions): Promise<Cart> {
      requireId(params.customer_group.id, "cart line");
      const { store_id, id, ...body } = params;
      return action<Cart>(store_id, id, "customer-group-items", body, options);
    },

    removeItem(params: RemoveCartItemParams, options?: RequestOptions): Promise<Cart> {
      const { store_id, id, ...body } = params;
      return action<Cart>(store_id, id, "items/remove", body, options);
    },

    clear(params: ClearCartParams, options?: RequestOptions): Promise<Cart> {
      return action<Cart>(params.store_id, params.id, "clear", { expected_updated_at: params.expected_updated_at }, options);
    },

    selectShippingMethod(params: SelectCartShippingMethodParams, options?: RequestOptions): Promise<Cart> {
      const { store_id, id, ...body } = params;
      return action<Cart>(store_id, id, "shipping-method", body, options);
    },

    setFutureDeliveries(params: SetCartFutureDeliveriesParams, options?: RequestOptions): Promise<Cart> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<Cart>(`${cartPath(store_id, id)}/future-deliveries`, body, options);
    },

    quoteFutureDeliveries(
      params: QuoteCartFutureDeliveriesParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupDeliveryOffers[]> {
      const { store_id, id, ...body } = params;
      return action<CustomerGroupDeliveryOffers[]>(store_id, id, "future-delivery-quote", body, options);
    },

    previewAccessProduct(params: PreviewCartAccessProductParams, options?: RequestOptions): Promise<CartAccessProductPreview> {
      const { store_id, id, ...body } = params;
      return action<CartAccessProductPreview>(store_id, id, "access-product-preview", body, options);
    },

    quote(params: QuoteCartParams, options?: RequestOptions): Promise<CartQuote> {
      return action<CartQuote>(params.store_id, params.id, "quote", { language: params.language, ...(params.contact_email !== undefined ? { contact_email: params.contact_email } : {}) }, options);
    },

    quotePurchase(params: QuotePurchaseParams, options?: RequestOptions): Promise<CartQuote> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<CartQuote>(storePath(store_id, "orders/quote"), body, options);
    },

    offer: {
      create(params: CreateCartOfferParams, options?: RequestOptions): Promise<Cart> {
        const { store_id, id, ...body } = params;
        return action<Cart>(store_id, id, "offer", body, options);
      },

      quote(params: QuoteCartOfferParams, options?: RequestOptions): Promise<CartQuote> {
        return action<CartQuote>(
          params.store_id,
          params.id,
          "offer/quote",
          { expected_updated_at: params.expected_updated_at, language: params.language },
          options,
        );
      },

      send(params: SendCartOfferParams, options?: RequestOptions): Promise<Cart> {
        const { store_id, id, ...body } = params;
        return action<Cart>(store_id, id, "offer/send", body, options);
      },

      withdraw(params: WithdrawCartOfferParams, options?: RequestOptions): Promise<Cart> {
        return action<Cart>(
          params.store_id,
          params.id,
          "offer/withdraw",
          { expected_updated_at: params.expected_updated_at },
          options,
        );
      },
    },

    checkout(params: CheckoutCartParams, options?: RequestOptions): Promise<CheckoutAcceptance> {
      requireId(params.order_id, "order");
      if (!isOrderToken(params.order_token)) throw new TypeError("A canonical order token is required");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<CheckoutAcceptance>(storePath(store_id, `${collection}/accept`), body, options);
    },

    checkoutOnAccount(params: CheckoutCartOnAccountParams, options?: RequestOptions): Promise<CheckoutAcceptance> {
      requireId(params.order_id, "order");
      if (!isOrderToken(params.order_token)) throw new TypeError("A canonical order token is required");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<CheckoutAcceptance>(
        storePath(store_id, `${collection}/accept-on-account`),
        body,
        options,
      );
    },
  };
};

export interface RequestOptions {
    successMessage?: string;
    errorMessage?: string;
    headers?: Record<string, string>;
}

export interface EshopItem {
    productId: string;
    variantId: string;
    quantity: number;
}

export interface GetQuoteParams {
    items: EshopItem[];
    market: string;
    currency: string;
    paymentMethod: string;
    shippingMethodId?: string;
    promoCode?: string;
}

export interface CheckoutParams {
    items: EshopItem[];
    paymentMethod: string;
    blocks?: any[];
    market: string;
    shippingMethodId: string;
    promoCode?: string;
}

export interface GetProductsParams {
    categoryIds?: string[] | null;
    status?: string;
    limit?: number;
    cursor?: string;
}

export interface GetProductBySlugParams {
    businessId: string;
    slug: string;
}

export interface GetCollectionEntriesParams {
    collectionId: string;
    limit?: number;
    cursor?: string;
    ids?: string[];
}

export interface CreateCollectionEntryParams {
    collectionId: string;
    blocks: any[];
    status?: string;
}

export interface UploadBusinessMediaParams {
    businessId: string;
    files?: File[];
    urls?: string[];
}

export interface DeleteBusinessMediaParams {
    id: string;
    mediaId: string;
}

export interface GetBusinessMediaParams {
    businessId: string;
    cursor?: string | null;
    limit?: number;
}

export interface NewsletterSubscribeParams {
    newsletterId: string;
    email: string;
    customerId?: string;
    payment?: any;
}

export interface NewsletterFindParams {
    businessId: string;
}

export interface NewsletterGetParams {
    id: string;
}

export interface UpdateUserParams {
    id: string;
    name?: string;
    email?: string;
}

export interface LoginUserParams {
    email?: string;
    password?: string;
    provider: string;
    token?: string;
}

export interface RegisterUserParams {
    name: string;
    email: string;
    password: string;
}

export interface UpdateProfilePhoneParams {
    phoneNumber: string;
}

export interface VerifyPhoneCodeParams {
    phoneNumber: string;
    code: string;
}

export interface GetServicesParams {
    providerId?: string;
    limit?: number;
    cursor?: string;
}

export interface ReservationCheckoutParams {
    parts: any[];
    paymentMethod?: string;
    blocks?: any[];
    market?: string;
    promoCode?: string;
}

export interface GetReservationQuoteParams {
    parts: any[];
    market: string;
    currency: string;
    paymentMethod: string;
    promoCode?: string;
}

export interface GetAvailableSlotsParams {
    serviceId: string;
    providerId?: string | null;
    from: number;
    to: number;
    limit?: number;
}

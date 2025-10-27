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

// Analytics API Types
export interface GetAnalyticsParams {
    businessId: string;
    metrics?: string[];
    period?: string;
    start_date?: string;
    end_date?: string;
    interval?: string;
}

export interface GetAnalyticsHealthParams {
    businessId: string;
}

// Notification API Types
export interface GetNotificationsParams {
    previous_id?: string;
    limit: number;
}

// Role API Types
export interface CreateRoleParams {
    name: string;
    businessId?: string;
    parentRoles?: string[];
    permissions?: any[];
    [key: string]: any;
}

export interface UpdateRoleParams {
    id: string;
    name?: string;
    businessId?: string;
    parentRoles?: string[];
    permissions?: any[];
    [key: string]: any;
}

export interface DeleteRoleParams {
    id: string;
}

export interface GetRoleParams {
    id: string;
}

export interface GetRolesParams {
    businessId?: string;
    action?: string;
}

export interface GetRoleParentsParams {
    roleId: string;
}

export interface GetInvoiceParams {
    roleId: string;
    from: string;
    to: string;
    language: string;
}

// Promo Code API Types
export interface CreatePromoCodeParams {
    businessId: string;
    code?: string;
    name?: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usagePerUser?: number;
    startsAt?: string;
    expiresAt?: string;
    applicableProducts?: string[];
    applicableCategories?: string[];
    status?: string;
    [key: string]: any;
}

export interface UpdatePromoCodeParams {
    id: string;
    businessId: string;
    code?: string;
    name?: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usagePerUser?: number;
    startsAt?: string;
    expiresAt?: string;
    applicableProducts?: string[];
    applicableCategories?: string[];
    status?: string;
    [key: string]: any;
}

export interface DeletePromoCodeParams {
    id: string;
    businessId: string;
}

export interface GetPromoCodeParams {
    id: string;
    businessId: string;
}

export interface GetPromoCodesParams {
    businessId: string;
    statuses?: string[];
    query?: string;
    limit?: number;
    cursor?: string;
    sortField?: string;
    sortDirection?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    startsAtFrom?: string;
    startsAtTo?: string;
    expiresAtFrom?: string;
    expiresAtTo?: string;
}

export interface GetPromoCodeByCodeParams {
    businessId: string;
    code: string;
}

export interface UpdatePromoCodeStatusParams {
    id: string;
    businessId: string;
    status: string;
    reason?: string;
}

export interface ValidatePromoCodeParams {
    businessId: string;
    code: string;
    orderTotal?: number;
    userId?: string;
}

export interface ApplyPromoCodeParams {
    businessId: string;
    code: string;
    orderId: string;
    userId: string;
}

// Business API Types
export interface CreateBusinessParams {
    name: string;
    slug?: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: any;
    settings?: any;
    [key: string]: any;
}

export interface UpdateBusinessParams {
    id: string;
    name?: string;
    slug?: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: any;
    settings?: any;
    [key: string]: any;
}

export interface DeleteBusinessParams {
    id: string;
}

export interface GetBusinessParams {
    id: string;
}

export interface GetBusinessParentsParams {
    businessId: string;
}

export interface TriggerBuildsParams {
    id: string;
}

export interface GetSubscriptionParams {
    businessId: string;
}

export interface CreateSubscriptionParams {
    businessId: string;
    planId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface UpdateSubscriptionParams {
    businessId: string;
    planId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface CancelSubscriptionParams {
    businessId: string;
    immediately?: boolean;
}

export interface ReactivateSubscriptionParams {
    businessId: string;
}

export interface CreatePortalSessionParams {
    businessId: string;
    returnUrl: string;
}

export interface InviteUserParams {
    businessId: string;
    email: string;
    roleIds?: string[] | null;
}

export interface HandleInvitationParams {
    businessId: string;
    token: string;
    action: string;
}

export interface TestWebhookParams {
    businessId: string;
    webhook: any;
}

// Additional CMS API Types
export interface CreateCollectionParams {
    businessId: string;
    name: string;
    description?: string;
    schema?: any;
    [key: string]: any;
}

export interface UpdateCollectionParams {
    businessId: string;
    id: string;
    name?: string;
    description?: string;
    schema?: any;
    [key: string]: any;
}

export interface DeleteCollectionParams {
    businessId: string;
    id: string;
}

export interface GetCollectionParams {
    businessId: string;
    id: string;
}

export interface GetCollectionsParams {
    businessId: string;
    name?: string | null;
    ids?: string[] | null;
}

export interface GetEntriesParams {
    businessId: string;
    owner?: string | null;
    collectionId?: string | null;
    limit?: number;
    cursor?: string;
    ids?: string[] | null;
    query?: string | null;
    type?: string | null;
    statuses?: string[] | null;
    sortField?: string | null;
    sortDirection?: string | null;
    createdAtFrom?: string | null;
    createdAtTo?: string | null;
    parentId?: string | null;
}

export interface CreateEntryParams {
    businessId: string;
    owner?: string;
    collectionId?: string;
    blocks: any[];
    status?: string;
    [key: string]: any;
}

export interface UpdateEntryParams {
    businessId: string;
    id: string;
    owner?: string;
    collectionId?: string;
    blocks?: any[];
    status?: string;
    [key: string]: any;
}

export interface DeleteEntryParams {
    businessId: string;
    id: string;
}

export interface GetEntryParams {
    businessId: string;
    id: string;
}

export interface GenerateBlocksParams {
    businessId: string;
    [key: string]: any;
}

export interface GetVariableMetadataParams {
    entryType: string;
}

export interface SendEntryParams {
    businessId: string;
    entryId: string;
    scheduledAt?: number;
}

// Additional E-shop API Types
export interface CreateProductParams {
    businessId: string;
    name: string;
    description?: string;
    categoryIds?: string[];
    variants?: any[];
    status?: string;
    [key: string]: any;
}

export interface UpdateProductParams {
    businessId: string;
    id: string;
    name?: string;
    description?: string;
    categoryIds?: string[];
    variants?: any[];
    status?: string;
    [key: string]: any;
}

export interface DeleteProductParams {
    businessId: string;
    id: string;
}

export interface GetProductParams {
    businessId: string;
    id: string;
}

export interface GetAllProductsParams {
    businessId: string;
    categoryIds?: string[] | null;
    categoryId?: string | null;
    categoryFilterBlocks?: string | null;
    matchAll?: boolean | null;
    statuses?: string[] | null;
    productType?: string | null;
    query?: string | null;
    limit?: number | null;
    cursor?: string | null;
    sortField?: string | null;
    sortDirection?: string | null;
    createdAtFrom?: string | null;
    createdAtTo?: string | null;
}

export interface GetOrderParams {
    businessId: string;
    id: string;
}

export interface GetOrdersParams {
    businessId: string;
    userId?: string | null;
    statuses?: string[] | null;
    query?: string | null;
    limit?: number | null;
    cursor?: string | null;
    sortField?: string | null;
    sortDirection?: string | null;
    createdAtFrom?: string | null;
    createdAtTo?: string | null;
}

export interface UpdateOrderStatusParams {
    businessId: string;
    id: string;
    status: string;
    [key: string]: any;
}

export interface UpdateOrderPaymentStatusParams {
    businessId: string;
    id: string;
    paymentStatus: string;
    [key: string]: any;
}

export interface UpdateOrderParams {
    businessId: string;
    id?: string;
    [key: string]: any;
}

export interface CreateOrderParams {
    businessId: string;
    [key: string]: any;
}

// Additional Newsletter API Types
export interface CreateNewsletterParams {
    businessId: string;
    name: string;
    description: string;
    newsletterType: 'FREE' | 'PAID';
    prices?: any[];
    unsubscribeRedirectUrl: string;
    [key: string]: any;
}

export interface UpdateNewsletterParams {
    id: string;
    name?: string;
    description?: string;
    newsletterType?: 'FREE' | 'PAID';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    prices?: any[];
    unsubscribeRedirectUrl?: string;
    [key: string]: any;
}

export interface DeleteNewsletterParams {
    id: string;
}

export interface GetSubscribersParams {
    id: string;
}

export interface UnsubscribeParams {
    token: string;
}

// Additional Reservation API Types
export interface CreateReservationParams {
    businessId?: string;
    [key: string]: any;
}

export interface UpdateReservationParams {
    id: string;
    statuses?: any;
    blocks?: any;
    parts?: any;
    [key: string]: any;
}

export interface CreateProviderParams {
    businessId: string;
    name: string;
    [key: string]: any;
}

export interface UpdateProviderParams {
    businessId: string;
    id: string;
    name?: string;
    [key: string]: any;
}

export interface DeleteProviderParams {
    businessId: string;
    id: string;
}

export interface CreateServiceParams {
    businessId: string;
    name: string;
    [key: string]: any;
}

export interface UpdateServiceParams {
    businessId: string;
    id: string;
    name?: string;
    [key: string]: any;
}

export interface DeleteServiceParams {
    businessId: string;
    id: string;
}

export interface GetServiceParams {
    businessId: string;
    id: string;
}

export interface GetProvidersParams {
    businessId: string;
    serviceId?: string;
    ids?: string[];
    query?: string | null;
    statuses?: string[] | null;
    limit?: number;
    cursor?: string;
    sortField?: string | null;
    sortDirection?: string | null;
    createdAtFrom?: string | null;
    createdAtTo?: string | null;
    categoryId?: string | null;
    categoryFilterBlocks?: string | null;
}

export interface GetProvidersByServiceParams {
    businessId: string;
    serviceId: string;
    limit?: number;
    cursor?: string;
}

export interface GetProviderParams {
    businessId: string;
    id: string;
}

export interface GetAllServicesParams {
    businessId: string;
    providerId?: string;
    ids?: string[];
    query?: string | null;
    statuses?: string[] | null;
    limit?: number;
    cursor?: string;
    sortField?: string | null;
    sortDirection?: string | null;
    createdAtFrom?: string | null;
    createdAtTo?: string | null;
    categoryId?: string | null;
    categoryFilterBlocks?: string | null;
}

export interface ScheduleSetParams {
    businessId: string;
    workingTime: any;
    serviceIds: string[];
    providerIds: string[];
}

export interface GetBusinessServiceWorkingTimeParams {
    businessId: string;
    providerId: string;
    serviceId?: string;
}

export interface SearchMyReservationsParams {
    limit?: number;
    status?: string;
    cursor?: string;
}

export interface GetReservationParams {
    id: string;
    businessId?: string;
}

export interface GetReservationPartsParams {
    reservationId?: string;
}

export interface SearchAvailableSlotsParams {
    businessId: string;
    serviceId: string;
    limit: number;
    from?: number;
    to?: number;
    providerId?: string;
}

export interface ReservationConfirmParams {
    token: string;
}

export interface SearchReservationsParams {
    businessIds?: string[];
    serviceIds?: string[];
    providerIds?: string[];
    userId?: string;
    from?: number;
    to?: number;
    status?: string;
    limit?: number;
    cursor?: string;
    sortField?: string;
    sortOrder?: string;
}

// Additional User API Types
export interface UpdateUserProfileParams {
    name: string;
    phoneNumbers?: string[];
    phoneNumber?: string | null;
    addresses?: any[];
    apiTokens?: any | null;
}

export interface SetRoleParams {
    userId: string;
    roleId: string;
}

export interface GetPermissionsParams {
    businessId: string;
}

export interface GetUsersParams {
    limit?: number;
    cursor?: string | null;
    query?: string;
    roleIds?: string[];
    businessIds?: string[];
    owner?: string;
}

export interface ConfirmUserParams {
    token: string;
}

export interface GetLoginUrlParams {
    provider: string;
    originUrl: string;
    redirectUrl: string;
}

export interface OAuthLoginParams {
    code: string;
    provider: string;
    originUrl: string;
}

export interface ForgotPasswordParams {
    email: string;
}

export interface ResetForgotPasswordParams {
    token: string;
    password: string;
}

export interface ResetPasswordParams {
    newPassword: string;
    oldPassword?: string;
}

export interface GetUserLocationParams {
    // No params needed
}

export interface LogoutParams {
    // No params needed
}

// Boot API Types
export interface BootParams {
    // No params needed
}

// Payment API Types
export interface HandleStripeWebhookParams {
    // Webhook payload handled in body
    [key: string]: any;
}

export interface GetBusinessMarketsParams {
    businessId: string;
}

export interface GetBusinessMarketParams {
    businessId: string;
    marketId: string;
}

// Notification Tracking API Types
export interface TrackEmailOpenParams {
    trackingPixelId: string;
}

export interface GetDeliveryStatsParams {
    businessId: string;
}

// Analytics Admin API Types
export interface SetupAnalyticsParams {
    [key: string]: any;
}

// Reservation Checkout Params
export interface ReservationCheckoutParams {
    businessId?: string;
    parts: any[];
    paymentMethod?: string;
    blocks?: any[];
    market?: string;
    promoCode?: string;
}

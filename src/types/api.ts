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
    currency: string;
    paymentMethod: string;
    shippingMethodId?: string;
    promoCode?: string;
}

export interface CheckoutParams {
    items: EshopItem[];
    paymentMethod: string;
    blocks?: any[];
    shippingMethodId: string;
    promoCode?: string;
}

export interface GetProductsParams {
    categoryIds?: string[] | null;
    status?: string;
    limit?: number;
    cursor?: string;
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

export interface GetCollectionEntryParams {
    id: string;
}

export interface DeleteCollectionEntryParams {
    id: string;
}

export interface UploadBusinessMediaParams {
    files?: File[];
    urls?: string[];
}

export interface DeleteBusinessMediaParams {
    id: string;
    mediaId: string;
}

export interface GetBusinessMediaParams {
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
    // No params needed - uses apiConfig.businessId
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
    code?: string;
    originUrl?: string;
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
    promoCode?: string;
}

export interface GetReservationQuoteParams {
    parts: any[];
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
    metrics?: string[];
    period?: string;
    start_date?: string;
    end_date?: string;
    interval?: string;
}

export interface GetAnalyticsHealthParams {
    // No params needed - uses apiConfig.businessId
}

// Notification API Types
export interface GetNotificationsParams {
    previous_id?: string;
    limit: number;
}

// Role API Types
export interface CreateRoleParams {
    name: string;
    parentRoles?: string[];
    permissions?: any[];
    [key: string]: any;
}

export interface UpdateRoleParams {
    id: string;
    name?: string;
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
}

export interface GetPromoCodeParams {
    id: string;
}

export interface GetPromoCodesParams {
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
    code: string;
}

export interface UpdatePromoCodeStatusParams {
    id: string;
    status: string;
    reason?: string;
}

export interface ValidatePromoCodeParams {
    code: string;
    orderTotal?: number;
    userId?: string;
}

export interface ApplyPromoCodeParams {
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
}

export interface TriggerBuildsParams {
    id: string;
}

export interface GetSubscriptionParams {
}

export interface CreateSubscriptionParams {
    planId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface UpdateSubscriptionParams {
    planId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface CancelSubscriptionParams {
    immediately?: boolean;
}

export interface ReactivateSubscriptionParams {
}

export interface CreatePortalSessionParams {
    returnUrl: string;
}

export interface InviteUserParams {
    email: string;
    roleIds?: string[] | null;
}

export interface HandleInvitationParams {
    token: string;
    action: string;
}

export interface TestWebhookParams {
    webhook: any;
}

// Additional CMS API Types
export interface CreateCollectionParams {
    name: string;
    description?: string;
    schema?: any;
    [key: string]: any;
}

export interface UpdateCollectionParams {
    id: string;
    name?: string;
    description?: string;
    schema?: any;
    [key: string]: any;
}

export interface DeleteCollectionParams {
    id: string;
}

export interface GetCollectionParams {
    id: string;
}

export interface GetCollectionsParams {
    name?: string | null;
    ids?: string[] | null;
}

export interface GetEntriesParams {
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
    owner?: string;
    collectionId?: string;
    blocks: any[];
    status?: string;
    [key: string]: any;
}

export interface UpdateEntryParams {
    id: string;
    owner?: string;
    collectionId?: string;
    blocks?: any[];
    status?: string;
    [key: string]: any;
}

export interface DeleteEntryParams {
    id: string;
}

export interface GetEntryParams {
    id: string;
}

export interface GenerateBlocksParams {
    [key: string]: any;
}

export interface GetVariableMetadataParams {
    entryType: string;
}

export interface SendEntryParams {
    entryId: string;
    scheduledAt?: number;
}

// Additional E-shop API Types
export interface CreateProductParams {
    name: string;
    description?: string;
    categoryIds?: string[];
    variants?: any[];
    status?: string;
    [key: string]: any;
}

export interface UpdateProductParams {
    id: string;
    name?: string;
    description?: string;
    categoryIds?: string[];
    variants?: any[];
    status?: string;
    [key: string]: any;
}

export interface DeleteProductParams {
    id: string;
}

export interface GetProductParams {
    id: string;
}

export interface GetAllProductsParams {
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
    id: string;
}

export interface GetOrdersParams {
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
    id: string;
    status: string;
    [key: string]: any;
}

export interface UpdateOrderPaymentStatusParams {
    id: string;
    paymentStatus: string;
    [key: string]: any;
}

export interface UpdateOrderParams {
    id?: string;
    [key: string]: any;
}

export interface CreateOrderParams {
    [key: string]: any;
}

// Additional Newsletter API Types
export interface CreateNewsletterParams {
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
    name: string;
    [key: string]: any;
}

export interface UpdateProviderParams {
    id: string;
    name?: string;
    [key: string]: any;
}

export interface DeleteProviderParams {
    id: string;
}

export interface CreateServiceParams {
    name: string;
    [key: string]: any;
}

export interface UpdateServiceParams {
    id: string;
    name?: string;
    [key: string]: any;
}

export interface DeleteServiceParams {
    id: string;
}

export interface GetServiceParams {
    id: string;
}

export interface GetProvidersParams {
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
    serviceId: string;
    limit?: number;
    cursor?: string;
}

export interface GetProviderParams {
    id: string;
}

export interface GetAllServicesParams {
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
    workingTime: any;
    serviceIds: string[];
    providerIds: string[];
}

export interface GetBusinessServiceWorkingTimeParams {
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
}

export interface GetReservationPartsParams {
    reservationId?: string;
}

export interface SearchAvailableSlotsParams {
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
}

export interface GetUsersParams {
    limit?: number;
    cursor?: string | null;
    query?: string;
    roleIds?: string[];
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

// Payment API Types
export interface HandleStripeWebhookParams {
    // Webhook payload handled in body
    [key: string]: any;
}

export interface GetBusinessMarketsParams {
}

export interface GetBusinessMarketParams {
    marketId: string;
}

// Notification Tracking API Types
export interface TrackEmailOpenParams {
    trackingPixelId: string;
}

export interface GetDeliveryStatsParams {
}

// Analytics Admin API Types
export interface SetupAnalyticsParams {
    [key: string]: any;
}

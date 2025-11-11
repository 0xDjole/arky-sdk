// Core type definitions
// All types are exported individually for better tree-shaking

export * from './api';

// NEW: Payment structure (matches backend)
export interface Payment {
	currency: string;
	market: string;
	subtotal: number;
	shipping: number;
	discount: number;
	tax: number;
	total: number;
	promoCodeId?: string;
	promoCode?: string;
	promoType?: string;
	promoValue?: number;
	type: PaymentMethodType;
	customerId?: string;
	paymentIntentId?: string;
	subscriptionId?: string;
	priceId?: string;
}

export enum PaymentMethodType {
	Cash = "CASH",
	CreditCard = "CREDIT_CARD",
	Free = "FREE",
}

// Quote line item (from quote engine)
export interface QuoteLineItem {
	itemType: string;
	id: string;
	name: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

// Promo code validation result
export interface PromoCodeValidation {
	id: string;
	code: string;
	discountType: any;
	discountValue: number;
	conditions: any[];
}

// Quote response from backend (full pricing breakdown)
export interface Quote {
	currency: string;
	market: string;
	subtotal: number;
	shipping: number;
	discount: number;
	tax: number;
	total: number;
	lineItems: QuoteLineItem[];
	shippingMethod: ShippingMethod | null;
	promoCode: PromoCodeValidation | null;
	payment: Payment;
	chargeAmount: number;
}

// Market-based price structure (for product variants)
export interface Price {
	market: string;
	amount: number;
	compareAt?: number;
}

// Location structure (for shipping addresses, pickup points, etc.)
export interface Location {
	country?: string | null;
	address?: string | null;
	city?: string | null;
	postalCode?: string | null;
	countryCode?: string | null;
	coordinates?: { lat: number; lon: number } | null;
}

// Cart types
export interface EshopCartItem {
	id: string;
	productId: string;
	variantId: string;
	productName: string;
	productSlug: string;
	variantAttributes: Record<string, any>;
	price: Price; // Minor units (backend format)
	quantity: number;
	addedAt: number;
}

export interface ReservationCartPart {
	id: string;
	serviceId: string;
	serviceName: string;
	date: string;
	from: number;
	to: number;
	timeText: string;
	isMultiDay: boolean;
	reservationMethod: string;
	providerId?: string;
	blocks: any[];
}

// Payment provider types
export interface PaymentProviderConfig {
	type: "STRIPE";
	publicKey: string;
	secretKey: string;
	webhookSecret: string;
}

export interface ZoneDefinition {
	id: string;
	name: string;
}

export interface ZonePaymentMethod {
	id: string;
}

export interface ZoneShippingMethod {
	id: string;
	amount: number;
}

export interface MarketZone {
	taxBps: number;
	zoneId: string;
	paymentMethods: ZonePaymentMethod[];
	shippingMethods: ZoneShippingMethod[];
}

export interface Market {
	id: string;
	currency: string;
	taxMode: "EXCLUSIVE" | "INCLUSIVE";
	zones: MarketZone[];
}

export interface PaymentMethod {
	id: string;
	type: PaymentMethodType;
}

export interface ShippingMethod {
    id: string;
    type: 'SHIPPING' | 'PICKUP';
    taxable: boolean;
    etaText: string;
    location?: Location;
}

export interface ZoneResolvedShippingMethod extends ShippingMethod {
	zoneAmount: number;
}

export interface Language {
	id: string;
}

export interface BusinessEmails {
	billing: string;
	support: string;
}

export interface BusinessConfig {
	languages: Language[];
	zones: ZoneDefinition[];
	paymentMethods: PaymentMethod[];
	shippingMethods: ShippingMethod[];
	markets: Market[];
	buildHooks: string[];
	webhooks: any[];
	orderBlocks: any[];
	reservationBlocks: any[];
	paymentProvider?: PaymentProviderConfig;
	aiProvider?: any;
	emails: BusinessEmails;
}

export interface Business {
	id: string;
	name: string;
	configs?: BusinessConfig;
}

// Store state types - Simplified (business data moved to business store)
export interface EshopStoreState {
	businessId: string;
	selectedShippingMethodId: string | null;
	userToken: string | null;
	processingCheckout: boolean;
	loading: boolean;
	error: string | null;
	phoneNumber: string;
	phoneError: string | null;
	verificationCode: string;
	verifyError: string | null;
}

export interface Block {
	id: string;
	key: string;
	type: string;
	properties?: any;
	value?: any;
}

// SEO types
export interface Seo {
	slug: Record<string, string>;
	metaTitle: Record<string, string>;
	metaDescription: Record<string, string>;
	canonicalUrl: Record<string, string>;
	ogImage: string;
}

// Media types
export interface MediaResolution {
	id: string;
	size: string;
	url: string;
}

export interface Media {
	id: string;
	resolutions: { [key: string]: MediaResolution };
	mimeType: string;
	title?: string | null;
	description?: string | null;
	alt?: string | null;
	owner: string;
	metadata?: string | null;
	uploadedAt: string;
	seo: Seo;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    cursor?: string;
    total?: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta?: {
		total: number;
		page: number;
		per_page: number;
	};
}

// Legacy types - kept for compatibility
export interface MarketConfigClient {
	currency: string;
	taxMode: string;
	defaultTaxRate: number;
	paymentMethods: string[];
	showTaxIncluded: boolean;
	shippingMethods?: ShippingMethod[];
}

export interface ReservationStoreState {
	currentStep: number;
	totalSteps: number;
	steps: Record<number, { name: string; labelKey: string }>;

	// Calendar data
	weekdays: string[];
	monthYear: string;
	days: any[];
	current: Date;

	// Selection state
	selectedDate: string | null;
	slots: any[];
	selectedSlot: any | null;
	selectedMethod: string | null;
	selectedProvider: any | null;
	providers: any[];

	// Status flags
	loading: boolean;
	startDate: string | null;
	endDate: string | null;
	isMultiDay: boolean;

	// Phone verification
	phoneNumber: string;
	phoneError: string | null;
	phoneSuccess: string | null;
	verificationCode: string;
	verifyError: string | null;
	isPhoneVerified: boolean;
	isSendingCode: boolean;
	isVerifying: boolean;
	codeSentAt: number | null;
	canResendAt: number | null;

	// Service & config
	guestToken: string | null;
	service: any | null;
	business: Business | null;
	currency: string;
	reservationBlocks: Block[];
	apiUrl: string;
	businessId: string;
	storageUrl: string;
	timezone: string;
	tzGroups: any;
	parts: ReservationCartPart[];

	// Payment configuration
	allowedPaymentMethods: string[];
	paymentConfig: {
		provider: PaymentProviderConfig | null;
		enabled: boolean;
	};
}

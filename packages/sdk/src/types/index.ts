// Core type definitions
// All types are exported individually for better tree-shaking

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
	method: PaymentMethod;
	customerId?: string;
	paymentIntentId?: string;
	subscriptionId?: string;
	priceId?: string;
}

export enum PaymentMethod {
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

// Zone structure (logistics grouping - countries, tax rates, shipping methods)
export interface Zone {
	id: string;
	name: string;
	countries: string[]; // Empty array = "All Countries"
	taxBps: number;
	shippingMethods: ShippingMethod[];
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

// Market types (business-owned) - camelCase for frontend
export interface Market {
	id: string;
	name: string;
	currency: string;
	taxMode: "INCLUSIVE" | "EXCLUSIVE";
	taxBps: number;
	paymentMethods: BusinessPaymentMethod[];
}

export interface ShippingMethod {
    id: string;
    type: 'SHIPPING' | 'PICKUP';
    prices: Price[]; // Market-based pricing with free thresholds
    taxable: boolean;
    etaText: string; // e.g., "3-5 business days"
    location?: Location; // Pickup address (only for PICKUP type)
}

export interface BusinessPaymentMethod {
	method: PaymentMethod;
}

// Business types
export interface BusinessConfig {
	orderBlocks?: any[];
	reservationBlocks?: any[];
	markets?: Market[];
	zones?: Zone[];
	paymentProvider?: PaymentProviderConfig;
	aiProvider?: any;
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

// Newsletter types
export interface Newsletter {
	id: string;
	businessId: string;
	name: string;
	description: string;
	newsletterType: "FREE" | "PAID";
	statuses: any[];
	prices: Price[]; // NEW: Market-based pricing
	paymentProduct?: {
		priceId: string;
	};
	unsubscribeRedirectUrl: string;
	createdAt: number;
	updatedAt: number;
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

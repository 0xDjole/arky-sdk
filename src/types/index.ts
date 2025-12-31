export * from './api';

export interface PaymentRefund {
	id: string;
	entity: string;
	total: number;
	providerRefundId?: string;
	status: string;
	createdAt: number;
}

export interface Payment {
	currency: string;
	market: string;
	subtotal: number;
	shipping: number;
	discount: number;
	total: number;
	paid: number;
	tax?: {
		amount: number;
		modeSnapshot?: string;
		rateBps: number;
		lines: Array<{ rateBps: number; amount: number; label?: string; scope?: string }>;
	};
	promoCode?: {
		id: string;
		code: string;
		type: string;
		value: number;
	};
	type: PaymentMethodType;
	provider?: {
		customerId: string;
		paymentIntentId?: string;
		subscriptionId?: string;
		priceId?: string;
	};
	refunds: PaymentRefund[];
	zoneId?: string;
	paymentMethodId?: string;
	shippingMethodId?: string;
}

export enum PaymentMethodType {
	Cash = "CASH",
	CreditCard = "CREDIT_CARD",
	Free = "FREE",
}

export interface PromoCodeValidation {
	promoCodeId: string;
	code: string;
	discounts: any[];
	conditions: any[];
}

export interface Quote {
	market: string;
	zone: Zone;
	subtotal: number;
	shipping: number;
	discount: number;
	tax: number;
	total: number;
	shippingMethod: ShippingMethod | null;
	paymentMethod: PaymentMethod | null;
	promoCode: PromoCodeValidation | null;
	payment: Payment;
	chargeAmount: number;
	id?: string;
	expiresAt?: number;
}

export interface Price {
	market: string;
	amount: number;
	compareAt?: number;
}

export interface Location {
	country?: string | null;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	coordinates?: { lat: number; lon: number } | null;
}

export interface EshopCartItem {
	id: string;
	productId: string;
	variantId: string;
	productName: string;
	productSlug: string;
	variantAttributes: Record<string, any>;
	price: Price;
	quantity: number;
	addedAt: number;
}

export interface ReservationCartItem {
	id: string;
	serviceId: string;
	serviceName: string;
	date: string;
	from: number;
	to: number;
	timeText: string;
	providerId?: string;
	blocks: any[];
}

export interface PaymentProviderConfig {
	type: "STRIPE";
	publicKey: string;
	secretKey: string;
	webhookSecret: string;
}

export interface ShippingWeightTier {
	upToGrams: number;
	amount: number;
}

export interface PaymentMethod {
	id: string;
	type: PaymentMethodType;
}

export interface ShippingMethod {
	id: string;
	taxable: boolean;
	etaText: string;
	pickupLocation?: Location;
	amount: number;
	freeAbove?: number;
	weightTiers?: ShippingWeightTier[];
}

export type ZoneScope = "ORDER" | "RESERVATION";

export interface Zone {
	id: string;
	marketId: string;
	scope: ZoneScope;
	countries: string[];
	states: string[];
	postalCodes: string[];
	taxBps: number;
	paymentMethods: PaymentMethod[];
	shippingMethods: ShippingMethod[];
}

export interface Market {
	id: string;
	currency: string;
	taxMode: "EXCLUSIVE" | "INCLUSIVE";
}

export interface Language {
	id: string;
}

export interface BusinessEmails {
	billing: string;
	support: string;
}

export interface OrderConfigs {
	isEmailRequired: boolean;
	isPhoneRequired: boolean;
}

export interface BusinessReservationConfigs {
	isEmailRequired: boolean;
	isPhoneRequired: boolean;
}

export interface BusinessConfig {
	languages: Language[];
	markets: Market[];
	zones: Zone[];
	buildHooks: string[];
	webhooks: any[];
	orderBlocks: any[];
	reservationBlocks: any[];
	orderConfigs: OrderConfigs;
	reservationConfigs: BusinessReservationConfigs;
	paymentProvider?: PaymentProviderConfig;
	aiProvider?: any;
	emails: BusinessEmails;
}

export interface Business {
	id: string;
	name: string;
	configs?: BusinessConfig;
}

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

export interface Seo {
	slug: Record<string, string>;
	metaTitle: Record<string, string>;
	metaDescription: Record<string, string>;
	canonicalUrl: Record<string, string>;
	ogImage: string;
}

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

export interface ReservationStoreState {
	currentStep: number;
	totalSteps: number;
	steps: Record<number, { name: string; labelKey: string }>;
	weekdays: string[];
	monthYear: string;
	days: any[];
	current: Date;
	selectedDate: string | null;
	slots: any[];
	selectedSlot: any | null;
	selectedProvider: any | null;
	providers: any[];
	loading: boolean;
	startDate: string | null;
	endDate: string | null;
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
	guestToken: string | null;
	service: any | null;
	business: Business | null;
	currency: string;
	reservationBlocks: Block[];
	apiUrl: string;
	businessId: string;
	timezone: string;
	tzGroups: any;
	items: ReservationCartItem[];
	allowedPaymentMethods: string[];
	paymentConfig: {
		provider: PaymentProviderConfig | null;
		enabled: boolean;
	};
}

export interface StatusEvent {
	id: string;
	changedBy: 'BUSINESS' | 'USER' | 'SYSTEM';
	userId?: string;
	status: string;
	note?: string;
	timestamp: number;
}

export interface ReservationItem {
	id: string;
	serviceId: string;
	providerId: string;
	businessId: string;
	reservationId: string;
	userId: string;
	from: number;
	to: number;
	blocks: Block[];
	price: Price;
}

export interface Reservation {
	id: string;
	number: string;
	userId: string;
	blocks: Block[];
	businessId: string;
	statuses: StatusEvent[];
	serviceIds: string[];
	providerIds: string[];
	payment: Payment;
	business?: Business;
	user?: any;
	items: ReservationItem[];
	email?: string;
	phone?: string;
	createdAt: number;
	lastModified: number;
}

// ===== CMS Types =====

// ===== Form Types =====

export interface Form {
	id: string;
	businessId: string;
	key: string;
	blocks: Block[];
	isPubliclyReadable: boolean;
	isPubliclyWritable: boolean;
	isSubmissionEnabled: boolean;
	isCaptchaRequired: boolean;
	notificationEmails: string[];
	statuses: StatusEvent[];
	createdAt: number;
	updatedAt: number;
}

export interface FormEntry {
	id: string;
	businessId: string;
	formId: string;
	blocks: Block[];
	statuses: StatusEvent[];
	createdAt: number;
	updatedAt: number;
}

// ===== Taxonomy Types =====

export enum TaxonomyScope {
	SERVICE = 'SERVICE',
	PROVIDER = 'PROVIDER',
	PRODUCT = 'PRODUCT',
}

export interface Taxonomy {
	id: string;
	businessId: string;
	name: string;
	scope: TaxonomyScope;
	blocks: Block[];
	parentId: string | null;
	hasChildren: boolean;
	statuses: StatusEvent[];
	createdAt: number;
	updatedAt: number;
}

export interface Node {
	id: string;
	key: string;
	businessId: string;
	blocks: Block[];
	parentId?: string | null;
	hasChildren: boolean;
	statuses: StatusEvent[];
	seo: Seo;
	createdAt: number;
	updatedAt: number;
}

// ===== Reservation Domain Types =====

export interface ServiceDuration {
	duration: number;
	isPause?: boolean;
}

export interface ServiceProvider {
	id: string;
	providerId: string;
	workingTime: {
		workingDays: Array<{ day: string; workingHours: Array<{ from: number; to: number }> }>;
		outcastDates: Array<{ month: number; day: number; workingHours: Array<{ from: number; to: number }> }>;
		specificDates: Array<{ date: number; workingHours: Array<{ from: number; to: number }> }>;
	};
	provider?: Provider;
}

export interface Service {
	id: string;
	key: string;
	seo: Seo;
	businessId: string;
	prices: Price[];
	durations: ServiceDuration[];
	blocks: Block[];
	taxonomyIds: string[];
	isApprovalRequired: boolean;
	providers: ServiceProvider[];
	createdAt: number;
	updatedAt: number;
	statuses: StatusEvent[];
}

export interface ProviderTimelinePoint {
	timestamp: number;
	concurrent: number;
}

export interface Provider {
	id: string;
	key: string;
	seo: Seo;
	businessId: string;
	statuses: StatusEvent[];
	concurrentLimit: number;
	taxonomyIds: string[];
	blocks: Block[];
	timeline: ProviderTimelinePoint[];
	createdAt: number;
	updatedAt: number;
}

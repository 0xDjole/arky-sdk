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
	Cash = "cash",
	CreditCard = "credit_card",
	// Free REMOVED - handled with logic: if total == 0, skip payment
	// NOTE: Apple Pay and Google Pay are NOT separate PaymentMethodTypes
	// They are handled automatically by Stripe's Payment Element
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

/** Price for products and services (market-based, no provider fields) */
export interface Price {
	currency: string;
	market: string;
	amount: number;
	compareAt?: number;
}

/** Interval period for subscription pricing */
export type IntervalPeriod = 'month' | 'year';

/** Subscription interval configuration */
export interface SubscriptionInterval {
	period: IntervalPeriod;
	count: number;
}

/** Price provider configuration (e.g., Stripe) */
export interface PriceProvider {
	type: string;
	id: string;
}

/** Price for audiences/subscriptions (provider-based with interval) */
export interface SubscriptionPrice {
	currency: string;
	amount: number;
	compareAt?: number;
	interval?: SubscriptionInterval;
	providers: PriceProvider[];
}

/**
 * Full address for shipping, billing, and fulfillment centers.
 * Used for order addresses and shipping labels.
 */
export interface Address {
	name: string;
	company?: string | null;
	street1: string;
	street2?: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	phone?: string | null;
	email?: string | null;
}

/**
 * Simple geo location for CMS map/location blocks.
 * Just coordinates and an optional label for display.
 */
export interface GeoLocation {
	coordinates?: { lat: number; lon: number } | null;
	label?: string | null;
}

/**
 * @deprecated Use Address for shipping/billing addresses, GeoLocation for map coordinates
 */
export type Location = Address & { coordinates?: { lat: number; lon: number } | null };

/**
 * Used for zone matching - simplified location with optional fields.
 */
export interface ZoneLocation {
	country?: string | null;
	state?: string | null;
	city?: string | null;
	postalCode?: string | null;
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

/** Card payment processor - business picks ONE
 * Handles: Credit/Debit Cards, Apple Pay, Google Pay
 * Note: Wallet payments are controlled via Stripe Dashboard and detected automatically
 */
export interface CardProvider {
	type: "stripe";
	accountId: string;
	currency: string;
}


/** @deprecated Use CardProvider instead */
export interface PaymentProviderConfig {
	type: "stripe";
	publicKey: string;
	secretKey: string;
	webhookSecret: string;
}

export interface AnalyticsConfig {
	type: "google_analytics4";
	measurementId: string;
}

export interface ShippingWeightTier {
	upToGrams: number;
	amount: number;
}

export interface PaymentMethod {
	id: string;
	name: Record<string, string>;
	type: PaymentMethodType;
}

export interface ShippingMethod {
	id: string;
	name: Record<string, string>;
	taxable: boolean;
	etaText: string;
	fulfillmentCenterId?: string;
	amount: number;
	freeAbove?: number;
	weightTiers?: ShippingWeightTier[];
}

export interface FulfillmentCenter {
	id: string;
	key: string;
	/** Ship-from address for shipping labels */
	address: Address;
	isPickupLocation: boolean;
}

export interface InventoryLevel {
	fulfillmentCenterId: string;
	available: number;
	reserved: number;
}

export type ZoneScope = "all" | "order" | "reservation";

export interface Zone {
	id: string;
	name: string;
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
	taxMode: "exclusive" | "inclusive";
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
	markets: Market[];
	zones: Zone[];
	fulfillmentCenters: FulfillmentCenter[];
	buildHooks: string[];
	webhooks: any[];
	/** Card payment processor (handles cards + Apple Pay + Google Pay) */
	cardProvider?: CardProvider;
	aiProvider?: any;
	analytics?: AnalyticsConfig;
	emails: BusinessEmails;
	/** Configured shipping providers (e.g., Shippo) */
	shippingProviders?: BusinessShippingProvider[];
}

export interface Subscription {
	id: string;
	target: string;
	planId: string;
	pendingPlanId: string | null;
	payment: any;
	status: SubscriptionStatus;
	endDate: number;
	usage: Record<string, any>;
	token: string;
}

export interface Business {
	id: string;
	key: string;
	networkKey: string | null;
	timezone: string;
	configs?: BusinessConfig;
	subscriptions?: Subscription[];
	status: Status;
}

export interface EshopStoreState {
	businessId: string;
	selectedShippingMethodId: string | null;
	userToken: string | null;
	processingCheckout: boolean;
	loading: boolean;
	error: string | null;
}

export interface Block {
	id: string;
	key: string;
	type: string;
	properties?: any;
	value?: any;
}

export type BlockType =
	| "text"
	| "localized_text"
	| "number"
	| "boolean"
	| "block"
	| "relationship_entry"
	| "relationship_media"
	| "markdown"
	| "geo_location";

export interface GeoLocationBlockProperties {}

/** @deprecated Use GeoLocation instead */
export type GeoLocationValue = GeoLocation;

export interface GeoLocationBlock extends Block {
	type: "geo_location";
	properties: GeoLocationBlockProperties;
	value: GeoLocation | null;
}

export type Access = 'public' | 'private';

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
	entity: string;
	metadata?: string | null;
	uploadedAt: string;
	slug: Record<string, string>;
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
		provider: CardProvider | null;
		enabled: boolean;
	};
}

export type Status = 'draft' | 'active' | 'archived';

export type OrderStatus = 'created' | 'pending' | 'authorized' | 'confirmed' | 'shipped' | 'completed' | 'cancelled' | 'failed';

export type ReservationStatus = 'created' | 'pending' | 'authorized' | 'confirmed' | 'completed' | 'cancelled' | 'failed';

export type SubscriptionStatus = 'pending' | 'active' | 'cancellation_scheduled' | 'cancelled' | 'expired';

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
	status: ReservationStatus;
	serviceIds: string[];
	providerIds: string[];
	payment: Payment;
	business?: Business;
	user?: any;
	items: ReservationItem[];
	createdAt: number;
	lastModified: number;
}

export interface Node {
	id: string;
	key: string;
	businessId: string;
	parentId?: string | null;
	blocks: Block[];
	status: Status;
	slug: Record<string, string>;
	access: Access;
	writeAccess: Access;
	emailSubject?: Record<string, string>;
	children: Node[];
	createdAt: number;
	updatedAt: number;
}

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
	slug: Record<string, string>;
	access: Access;
	businessId: string;
	prices: Price[];
	durations: ServiceDuration[];
	blocks: Block[];
	nodeIds: string[];
	isApprovalRequired: boolean;
	providers: ServiceProvider[];
	createdAt: number;
	updatedAt: number;
	status: Status;
}

export interface ProviderTimelinePoint {
	timestamp: number;
	concurrent: number;
}

export interface Provider {
	id: string;
	key: string;
	slug: Record<string, string>;
	access: Access;
	businessId: string;
	status: Status;
	concurrentLimit: number;
	nodeIds: string[];
	blocks: Block[];
	timeline: ProviderTimelinePoint[];
	createdAt: number;
	updatedAt: number;
}

export interface Workflow {
	id: string;
	key: string;
	businessId: string;
	secret: string;
	status: Status;
	nodes: Record<string, WorkflowNode>;
	edges: WorkflowEdge[];
	
	schedule?: string;
	createdAt: number;
	updatedAt: number;
}

export interface WorkflowEdge {
	id: string;
	source: string;
	sourceOutput: string;
	target: string;
}

export type WorkflowNode =
	| WorkflowTriggerNode
	| WorkflowHttpNode
	| WorkflowIfNode
	| WorkflowLoopNode
	| WorkflowWaitNode;

export interface WorkflowTriggerNode {
	type: 'trigger';
	event?: string;
}

export interface WorkflowHttpNode {
	type: 'http';
	method: WorkflowHttpMethod;
	url: string;
	headers?: Record<string, string>;
	body?: any;
	timeoutMs?: number;
}

export interface WorkflowIfNode {
	type: 'if';
	condition: string;
}

export interface WorkflowLoopNode {
	type: 'loop';
	array: string;
}

export interface WorkflowWaitNode {
	type: 'wait';
	duration: string;
}

export type WorkflowHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting';

export interface WorkflowExecution {
	id: string;
	workflowId: string;
	businessId: string;
	status: ExecutionStatus;
	input: Record<string, any>;
	nodeOutputs: Record<string, any>;
	currentNode?: string;
	error?: string;
	scheduledAt: number;
	startedAt: number;
	completedAt?: number;
	createdAt: number;
	updatedAt: number;
}

export interface Audience {
	id: string;
	businessId: string;
	key: string;
	access: Access;
	nodeIds: string[];
	prices: SubscriptionPrice[];
	status: Status;
}

export interface AudienceAccessResponse {
	hasAccess: boolean;
	subscription?: Subscription;
}

export interface AudienceSubscribeResponse {
	checkoutUrl?: string;
	subscription?: Subscription;
}

export type BusinessEventAction =
	
	| { action: 'order_created' }
	| { action: 'order_status_changed'; data: { from: string; to: string } }
	| { action: 'order_payment_received'; data: { amount: number } }
	| { action: 'order_payment_failed'; data: { reason?: string } }
	| { action: 'order_refunded'; data: { amount: number; reason?: string } }
	| { action: 'order_shipped'; data: { tracking_url?: string } }
	| { action: 'order_completed' }
	| { action: 'order_cancelled'; data: { reason?: string } }
	
	| { action: 'reservation_created' }
	| { action: 'reservation_status_changed'; data: { from: string; to: string } }
	| { action: 'reservation_payment_received'; data: { amount: number } }
	| { action: 'reservation_payment_failed'; data: { reason?: string } }
	| { action: 'reservation_refunded'; data: { amount: number; reason?: string } }
	| { action: 'reservation_completed' }
	| { action: 'reservation_cancelled'; data: { reason?: string } };

export interface BusinessEvent {
	id: string;
	businessId: string;
	entity: string;
	payload: BusinessEventAction;
	actor: string;
	createdAt: number;
}

// Shipping Types

/** Shipping status for order fulfillment tracking */
export type ShippingStatus =
	| 'pending'
	| 'label_created'
	| 'in_transit'
	| 'out_for_delivery'
	| 'delivered'
	| 'failed'
	| 'returned';

/** Order shipping information (legacy - kept for backward compatibility) */
export interface OrderShipping {
	carrier: string;
	service: string;
	trackingNumber?: string | null;
	trackingUrl?: string | null;
	labelUrl?: string | null;
	status: ShippingStatus;
}

/** Individual shipment for an order (ships from one fulfillment center) */
export interface Shipment {
	id: string;
	fulfillmentCenterId: string;
	itemIds: string[];              // OrderItem IDs in this shipment
	carrier?: string | null;        // Set when label purchased
	service?: string | null;
	trackingNumber?: string | null;
	trackingUrl?: string | null;
	labelUrl?: string | null;
	status: ShippingStatus;
	createdAt: number;
	updatedAt: number;
}

/** Shipping rate from provider */
export interface ShippingRate {
	id: string;
	provider: string;
	carrier: string;
	service: string;
	displayName: string;
	amount: number;
	currency: string;
	estimatedDays?: number | null;
}

/**
 * @deprecated Use Address instead
 * Shipping address for rate requests
 */
export type ShippingAddress = Address;

/** Parcel dimensions for shipping */
export interface Parcel {
	length: number;
	width: number;
	height: number;
	weight: number;
	distanceUnit: 'in' | 'cm';
	massUnit: 'oz' | 'lb' | 'g' | 'kg';
}

/** Result from purchasing a shipping label */
export interface PurchaseLabelResult {
	trackingNumber: string;
	trackingUrl?: string | null;
	labelUrl: string;
	carrier: string;
	service: string;
}

/** Shipping provider status */
export type ShippingProviderStatus = 'active' | 'inactive';

/** Shippo shipping provider configuration */
export interface ShippingProviderShippo {
	type: 'shippo';
	id: string;
	status: ShippingProviderStatus;
	apiToken: string;
}

/** Business shipping provider (union type for extensibility) */
export type BusinessShippingProvider = ShippingProviderShippo;

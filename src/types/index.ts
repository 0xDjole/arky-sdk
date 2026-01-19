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

export type PriceType = 'recurring' | 'one_time';

export interface Price {
	market: string;
	amount: number;
	compareAt?: number;
	type: PriceType;
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
	name: Record<string, string>;
	type: PaymentMethodType;
}

export interface ShippingMethod {
	id: string;
	name: Record<string, string>;
	taxable: boolean;
	etaText: string;
	pickupLocation?: Location;
	amount: number;
	freeAbove?: number;
	weightTiers?: ShippingWeightTier[];
}

export type ZoneScope = "ALL" | "ORDER" | "RESERVATION";

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
	taxMode: "EXCLUSIVE" | "INCLUSIVE";
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
	buildHooks: string[];
	webhooks: any[];
	paymentProvider?: PaymentProviderConfig;
	aiProvider?: any;
	emails: BusinessEmails;
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
	| "TEXT"
	| "LOCALIZED_TEXT"
	| "NUMBER"
	| "BOOLEAN"
	| "BLOCK"
	| "RELATIONSHIP_ENTRY"
	| "RELATIONSHIP_MEDIA"
	| "MARKDOWN"
	| "EMAIL"
	| "PHONE"
	| "ADDRESS";

export type AddressType = "SHIPPING" | "BILLING";

export interface EmailBlockProperties {
	minValues?: number;
	maxValues?: number;
}

export interface PhoneBlockProperties {
	minValues?: number;
	maxValues?: number;
}

export interface AddressBlockProperties {
	minValues?: number;
	maxValues?: number;
	addressType: AddressType;
}

export interface GeoLocationValue {
	country?: string | null;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	coordinates?: { lat: number; lon: number } | null;
}

export interface EmailBlock extends Block {
	type: "EMAIL";
	properties: EmailBlockProperties;
	value: string[];
}

export interface PhoneBlock extends Block {
	type: "PHONE";
	properties: PhoneBlockProperties;
	value: string[];
}

export interface AddressBlock extends Block {
	type: "ADDRESS";
	properties: AddressBlockProperties;
	value: GeoLocationValue[];
}

export type Access = 'PUBLIC' | 'AUTHENTICATED' | 'PRIVATE';

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
		provider: PaymentProviderConfig | null;
		enabled: boolean;
	};
}

export type Status = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type OrderStatus = 'INITIATED' | 'PENDING' | 'AUTHORIZED' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export type ReservationStatus = 'INITIATED' | 'PENDING' | 'AUTHORIZED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'CANCELLATION_SCHEDULED' | 'CANCELLED' | 'EXPIRED';

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

// ===== CMS Types =====

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

// ===== Workflow Types =====

export interface Workflow {
	id: string;
	key: string;
	businessId: string;
	secret: string;
	status: Status;
	nodes: Record<string, WorkflowNode>;
	edges: WorkflowEdge[];
	/** Optional cron schedule expression (e.g., "0 9 * * *" for 9am daily) */
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

export type WorkflowHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING';

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

// ===== Audience Types =====

export interface Audience {
	id: string;
	businessId: string;
	key: string;
	access: Access;
	nodeIds: string[];
	prices: Price[];
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

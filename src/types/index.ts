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
	currency: string;
	market: string;
	amount: number;
	compareAt?: number;
	audienceId?: string;
}


export type IntervalPeriod = 'month' | 'year';


export interface SubscriptionInterval {
	period: IntervalPeriod;
	count: number;
}


export interface PriceProvider {
	type: string;
	id: string;
}


export interface SubscriptionPrice {
	currency: string;
	amount: number;
	compareAt?: number;
	interval?: SubscriptionInterval;
	providers: PriceProvider[];
}


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


export interface GeoLocation {
	coordinates?: { lat: number; lon: number } | null;
	label?: string | null;
}


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

export interface BookingCartItem {
	id: string;
	serviceId: string;
	serviceName: string;
	date: string;
	from: number;
	to: number;
	timeText: string;
	providerId?: string;
	forms: any[];
}


export type IntegrationProvider =
	| { type: 'stripe'; secretKey?: string; publishableKey: string; webhookSecret?: string; currency: string; activeForCardPayments?: boolean }
	| { type: 'shippo'; apiToken?: string; activeForFulfillment?: boolean }
	| { type: 'google'; clientId?: string; clientSecret?: string; accessToken?: string; refreshToken?: string;
		tokenExpiresAt?: number; scopes: string[]; accountEmail?: string | null; connectedAt: number }
	| { type: 'google_analytics4'; measurementId: string; activeForTracking?: boolean }
	| { type: 'telegram_bot'; botToken?: string }
	| { type: 'instagram_messenger'; pageAccessToken?: string; verifyToken?: string }
	| { type: 'deep_seek'; apiKey?: string; model?: string }
	
	| { type: 'open_ai'; apiKey?: string; model?: string }
	| { type: 'slack'; apiKey?: string }
	| { type: 'discord'; apiKey?: string }
	| { type: 'whats_app'; apiKey?: string }
	| { type: 'resend'; apiKey?: string }
	| { type: 'send_grid'; apiKey?: string }
	| { type: 'airtable'; apiKey?: string }
	| { type: 'linear'; apiKey?: string }
	| { type: 'git_hub'; apiKey?: string }
	| { type: 'git_lab'; apiKey?: string }
	| { type: 'dropbox'; apiKey?: string }
	| { type: 'hub_spot'; apiKey?: string }
	| { type: 'monday'; apiKey?: string }
	| { type: 'click_up'; apiKey?: string }
	| { type: 'pipedrive'; apiKey?: string }
	| { type: 'calendly'; apiKey?: string }
	| { type: 'typeform'; apiKey?: string }
	| { type: 'webflow'; apiKey?: string }
	| { type: 'trello'; apiKey?: string }
	| { type: 'perplexity'; apiKey?: string; model?: string }
	| { type: 'replicate'; apiKey?: string }
	| { type: 'asana'; apiKey?: string }
	| { type: 'brevo'; apiKey?: string }
	| { type: 'intercom'; apiKey?: string }
	| { type: 'google_gemini'; apiKey?: string; model?: string }
	
	| { type: 'anthropic'; apiKey?: string; model?: string }
	| { type: 'notion'; apiKey?: string }
	| { type: 'eleven_labs'; apiKey?: string }
	| { type: 'active_campaign'; apiKey?: string; accountUrl: string }
	| { type: 'shopify'; apiKey?: string; storeDomain: string }
	| { type: 'supabase'; apiKey?: string; projectUrl: string }
	| { type: 'mailchimp'; apiKey?: string }
	
	| { type: 'twilio'; accountSid?: string; authToken?: string }
	| { type: 'jira'; email?: string; apiToken?: string; domain: string }
	| { type: 'woo_commerce'; consumerKey?: string; consumerSecret?: string; storeUrl: string }
	| { type: 'freshdesk'; apiKey?: string; domain: string }
	| { type: 'zendesk'; apiToken?: string; email?: string; subdomain: string }
	
	| { type: 'salesforce'; accessToken?: string; instanceUrl: string }
	| { type: 'zoom'; apiKey?: string }
	| { type: 'microsoft_teams'; apiKey?: string }
	| { type: 'firebase'; apiKey?: string }
	| { type: 'arky'; apiKey?: string }
	
	| { type: 'vercel_deploy_hook'; url?: string }
	| { type: 'netlify_deploy_hook'; url?: string }
	| { type: 'cloudflare_deploy_hook'; url?: string }
	| { type: 'custom_deploy_hook'; url?: string };


export interface Integration {
	id: string;
	businessId: string;
	key: string;
	provider: IntegrationProvider;
	createdAt: number;
	updatedAt: number;
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
	locationId?: string;
	amount: number;
	freeAbove?: number;
	weightTiers?: ShippingWeightTier[];
}

export interface Location {
	id: string;
	businessId: string;
	key: string;
	address: Address;
	isPickupLocation: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface InventoryLevel {
	locationId: string;
	available: number;
	reserved: number;
}

export type ZoneScope = "all" | "order" | "booking";

export interface Zone {
	id: string;
	businessId: string;
	marketId: string;
	scope: ZoneScope;
	countries: string[];
	states: string[];
	postalCodes: string[];
	taxBps: number;
	paymentMethods: PaymentMethod[];
	shippingMethods: ShippingMethod[];
	createdAt: number;
	updatedAt: number;
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

export type WebhookEventSubscription =
	| { event: 'node.created'; parentId?: string }
	| { event: 'node.updated'; key?: string }
	| { event: 'node.deleted'; key?: string }
	| { event: 'order.created' }
	| { event: 'order.updated' }
	| { event: 'order.status_changed' }
	| { event: 'order.payment_received' }
	| { event: 'order.payment_failed' }
	| { event: 'order.refunded' }
	| { event: 'order.completed' }
	| { event: 'order.cancelled' }
	| { event: 'order.shipment_created' }
	| { event: 'order.shipment_in_transit' }
	| { event: 'order.shipment_out_for_delivery' }
	| { event: 'order.shipment_delivered' }
	| { event: 'order.shipment_failed' }
	| { event: 'order.shipment_returned' }
	| { event: 'order.shipment_status_changed' }
	| { event: 'booking.created' }
	| { event: 'booking.updated' }
	| { event: 'booking.status_changed' }
	| { event: 'booking.payment_received' }
	| { event: 'booking.payment_failed' }
	| { event: 'booking.refunded' }
	| { event: 'booking.completed' }
	| { event: 'booking.cancelled' }
	| { event: 'product.created' }
	| { event: 'product.updated' }
	| { event: 'product.deleted' }
	| { event: 'provider.created' }
	| { event: 'provider.updated' }
	| { event: 'provider.deleted' }
	| { event: 'service.created' }
	| { event: 'service.updated' }
	| { event: 'service.deleted' }
	| { event: 'media.created' }
	| { event: 'media.deleted' }
	| { event: 'business.created' }
	| { event: 'business.updated' }
	| { event: 'business.deleted' }
	| { event: 'audience.created' }
	| { event: 'audience.updated' }
	| { event: 'audience.deleted' };

export interface Webhook {
	id: string;
	businessId: string;
	key: string;
	url: string;
	events: WebhookEventSubscription[];
	headers: Record<string, string>;
	secret: string;
	enabled: boolean;
	createdAt: number;
	updatedAt: number;
}


export interface BusinessConfig {
	languages: Language[];
	markets: Market[];
	aiId?: string | null;
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
	token: string;
}

export interface Business {
	id: string;
	key: string;
	timezone: string;
	configs?: BusinessConfig;
	subscription?: Subscription;
	counts?: Record<string, number>;
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

export type TaxonomySchemaType = "text" | "number" | "boolean" | "geo_location";

export interface TaxonomySchema {
	id: string;
	key: string;
	type: TaxonomySchemaType;
	value?: string[];
	min?: number | null;
	max?: number | null;
}

export interface TaxonomyField {
	id: string;
	key: string;
	type: TaxonomySchemaType;
	value: any;
}

export interface TaxonomyFieldQuery {
	key: string;
	type: TaxonomySchemaType;
	operation?: string;
	value: any;
	center?: { lat: number; lon: number };
	radius?: number;
}

export interface TaxonomyEntry {
	taxonomyId: string;
	fields: TaxonomyField[];
}

export interface TaxonomyQuery {
	taxonomyId: string;
	query: TaxonomyFieldQuery[];
}

export type FormSchemaType = "text" | "number" | "boolean" | "date" | "geo_location" | "select";

export interface FormSchema {
	id: string;
	key: string;
	type: FormSchemaType;
	required?: boolean;
	min?: number | null;
	max?: number | null;
	options?: string[];
}

export type FormFieldType = "text" | "number" | "boolean" | "date" | "geo_location" | "select";

export interface FormField {
	id: string;
	key: string;
	type: FormFieldType;
	value?: any;
}

export interface FormEntry {
	formId: string;
	fields: FormField[];
}

export type BlockType =
	| "text"
	| "localized_text"
	| "number"
	| "boolean"
	| "list"
	| "map"
	| "relationship_entry"
	| "relationship_media"
	| "markdown"
	| "geo_location";

export interface GeoLocationBlockProperties {}


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

export interface BookingStoreState {
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
	bookingForms: FormEntry[];
	apiUrl: string;
	businessId: string;
	timezone: string;
	tzGroups: any;
	items: BookingCartItem[];
	allowedPaymentMethods: string[];
	paymentConfig: {
		provider: { publishableKey: string; currency: string } | null;
		enabled: boolean;
	};
}

export type Status = 'active' | 'archived';

export type OrderStatus = Status;
export type OrderWorkflowStatus = 'created' | 'pending' | 'authorized' | 'confirmed' | 'shipped' | 'completed' | 'cancelled' | 'failed';

export type BookingStatus = Status;
export type BookingWorkflowStatus = 'created' | 'pending' | 'authorized' | 'confirmed' | 'completed' | 'cancelled' | 'failed';

export type SubscriptionStatus = 'pending' | 'active' | 'cancellation_scheduled' | 'cancelled' | 'expired';

export interface BookingItemSnapshot {
	serviceKey: string;
	providerKey: string;
	price: Price;
}

export interface TimeRange {
	from: number;
	to: number;
}

export interface BookingItem {
	id: string;
	serviceId: string;
	providerId: string;
	businessId: string;
	bookingId: string;
	from: number;
	to: number;
	forms: FormEntry[];
	snapshot: BookingItemSnapshot;
}

export interface Booking {
	id: string;
	number: string;
	forms: FormEntry[];
	businessId: string;
	status: BookingStatus;
	workflowStatus: BookingWorkflowStatus;
	serviceIds: string[];
	providerIds: string[];
	payment: Payment;
	business?: Business;
	account?: any;
	items: BookingItem[];
	audienceId?: string;
	createdAt: number;
	lastModified: number;
}

export interface Node {
	id: string;
	key: string;
	businessId: string;
	parentId?: string | null;
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	status: Status;
	slug: Record<string, string>;
	children: Node[];
	createdAt: number;
	updatedAt: number;
}

export interface EmailTemplate {
	id: string;
	key: string;
	businessId: string;
	subject: Record<string, string>;
	body: string;
	fromName: string;
	fromEmail: string;
	replyTo?: string;
	preheader?: string;
	status: Status;
	createdAt: number;
	updatedAt: number;
}

export interface Form {
	id: string;
	key: string;
	businessId: string;
	schema: FormSchema[];
	status: Status;
	createdAt: number;
	updatedAt: number;
}

export interface FormSubmission {
	id: string;
	formId: string;
	businessId: string;
	fields: FormField[];
	createdAt: number;
}

export interface Taxonomy {
	id: string;
	key: string;
	businessId: string;
	parentId?: string | null;
	schema?: TaxonomySchema[];
	status: Status;
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
	prices: Price[];
	durations: ServiceDuration[];
	isApprovalRequired: boolean;
	audienceIds: string[];
	workingDays: Array<{ day: string; workingHours: Array<{ from: number; to: number }> }>;
	specificDates: Array<{ date: number; workingHours: Array<{ from: number; to: number }> }>;
	slotInterval: number;
	forms?: FormEntry[];
}

export interface Service {
	id: string;
	key: string;
	slug: Record<string, string>;
	businessId: string;
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	createdAt: number;
	updatedAt: number;
	status: Status;
}

export interface ProviderTimelinePoint {
	timestamp: number;
	booked: number;
}

export interface Provider {
	id: string;
	key: string;
	slug: Record<string, string>;
	businessId: string;
	status: Status;
	audienceIds: string[];
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	timeline: ProviderTimelinePoint[];
	createdAt: number;
	updatedAt: number;
}

export interface WorkflowConnection {
	node: string;
	output: string;
}

export interface Workflow {
	id: string;
	key: string;
	businessId: string;
	secret: string;
	status: Status;
	nodes: Record<string, WorkflowNode>;

	schedule?: string;
	createdAt: number;
	updatedAt: number;
}

export type WorkflowNode =
	| WorkflowTriggerNode
	| WorkflowHttpNode
	| WorkflowSwitchNode
	| WorkflowTransformNode
	| WorkflowLoopNode;

export interface WorkflowTriggerNode {
	type: 'trigger';
	event?: string;
	delayMs?: number;
	schema?: Block[];
}

export interface WorkflowHttpNode {
	type: 'http';
	method: WorkflowHttpMethod;
	url: string;
	headers?: Record<string, string>;
	body?: any;
	timeoutMs?: number;
	integrationId?: string;
	integrationProviderId?: string;
	delayMs?: number;
	retries?: number;
	retryDelayMs?: number;
	edges?: WorkflowConnection[];
}

export interface WorkflowSwitchRule {
	condition: string;
}

export interface WorkflowSwitchNode {
	type: 'switch';
	rules: WorkflowSwitchRule[];
	delayMs?: number;
	edges?: WorkflowConnection[];
}

export interface WorkflowTransformNode {
	type: 'transform';
	code: string;
	delayMs?: number;
	edges?: WorkflowConnection[];
}

export interface WorkflowLoopNode {
	type: 'loop';
	expression: string;
	delayMs?: number;
	edges?: WorkflowConnection[];
	backEdges?: WorkflowConnection[];
}

export type WorkflowHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface NodeResult {
	output: any;
	route: string;
	startedAt: number;
	completedAt: number;
	durationMs: number;
	error?: string;
}

export interface WorkflowExecution {
	id: string;
	workflowId: string;
	businessId: string;
	status: ExecutionStatus;
	input: Record<string, any>;
	results: Record<string, NodeResult>;
	error?: string;
	scheduledAt: number;
	startedAt: number;
	completedAt?: number;
	createdAt: number;
	updatedAt: number;
}

export type AudienceType =
	| { type: 'standard' }
	| { type: 'paid'; prices: SubscriptionPrice[] };

export interface Audience {
	id: string;
	businessId: string;
	key: string;
	status: Status;
	type: AudienceType;
	confirmTemplateId?: string;
}

export interface AudienceAccessResponse {
	hasAccess: boolean;
	subscription?: Subscription;
}

export interface AudienceSubscribeResponse {
	checkoutUrl?: string;
	subscription?: Subscription;
}

export type EventAction =
	
	| { action: 'order_created' }
	| { action: 'order_updated' }
	| { action: 'order_status_changed'; data: { from: string; to: string } }
	| { action: 'order_payment_received'; data: { amount: number; currency: string } }
	| { action: 'order_payment_failed'; data: { reason?: string } }
	| { action: 'order_refunded'; data: { amount: number; currency: string; reason?: string } }
	| { action: 'order_completed' }
	| { action: 'order_cancelled'; data: { reason?: string } }
	
	| { action: 'order_shipment_created'; data: { shipment_id: string } }
	| { action: 'order_shipment_in_transit'; data: { shipment_id: string } }
	| { action: 'order_shipment_out_for_delivery'; data: { shipment_id: string } }
	| { action: 'order_shipment_delivered'; data: { shipment_id: string } }
	| { action: 'order_shipment_failed'; data: { shipment_id: string; reason?: string } }
	| { action: 'order_shipment_returned'; data: { shipment_id: string } }
	| { action: 'order_shipment_status_changed'; data: { shipment_id: string; from: string; to: string } }
	
	| { action: 'booking_created' }
	| { action: 'booking_updated' }
	| { action: 'booking_status_changed'; data: { from: string; to: string } }
	| { action: 'booking_payment_received'; data: { amount: number; currency: string } }
	| { action: 'booking_payment_failed'; data: { reason?: string } }
	| { action: 'booking_refunded'; data: { amount: number; currency: string; reason?: string } }
	| { action: 'booking_completed' }
	| { action: 'booking_cancelled'; data: { reason?: string } }
	
	| { action: 'product_created' }
	| { action: 'product_updated' }
	| { action: 'product_deleted' }
	
	| { action: 'node_created' }
	| { action: 'node_updated' }
	| { action: 'node_deleted' }
	
	| { action: 'provider_created' }
	| { action: 'provider_updated' }
	| { action: 'provider_deleted' }
	
	| { action: 'service_created' }
	| { action: 'service_updated' }
	| { action: 'service_deleted' }
	
	| { action: 'account_created' }
	| { action: 'account_updated' }
	| { action: 'account_deleted' }
	
	| { action: 'media_created' }
	| { action: 'media_deleted' }
	
	| { action: 'business_created' }
	| { action: 'business_updated' }
	| { action: 'business_deleted' }
	
	| { action: 'audience_created' }
	| { action: 'audience_updated' }
	| { action: 'audience_deleted' };

export interface Event {
	id: string;
	entity: string;
	event: EventAction;
	actor: string;
	createdAt: number;
}


export type ShippingStatus =
	| 'pending'
	| 'label_created'
	| 'in_transit'
	| 'out_for_delivery'
	| 'delivered'
	| 'failed'
	| 'returned';


export interface OrderShipping {
	carrier: string;
	service: string;
	trackingNumber?: string | null;
	trackingUrl?: string | null;
	labelUrl?: string | null;
	status: ShippingStatus;
}


export interface ShipmentLine {
	orderItemId: string;
	quantity: number;
}


export interface Shipment {
	id: string;
	locationId: string;
	lines: ShipmentLine[];
	carrier?: string | null;
	service?: string | null;
	trackingNumber?: string | null;
	trackingUrl?: string | null;
	labelUrl?: string | null;
	status: ShippingStatus;
	createdAt: number;
	updatedAt: number;
}


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


export type ShippingAddress = Address;


export interface Parcel {
	length: number;
	width: number;
	height: number;
	weight: number;
	distanceUnit: 'in' | 'cm';
	massUnit: 'oz' | 'lb' | 'g' | 'kg';
}


export interface PurchaseLabelResult {
	trackingNumber: string;
	trackingUrl?: string | null;
	labelUrl: string;
	carrier: string;
	service: string;
}


export interface ShipResult {
	shipmentId: string;
	trackingNumber: string;
	trackingUrl?: string | null;
	labelUrl: string;
}


export interface CustomsItem {
	description: string;
	quantity: number;
	netWeight: string;
	massUnit: string;
	valueAmount: string;
	valueCurrency: string;
	originCountry: string;
	tariffNumber?: string | null;
}


export interface CustomsDeclaration {
	contentsType: string;
	contentsExplanation?: string | null;
	nonDeliveryOption: string;
	certify: boolean;
	certifySigner: string;
	items: CustomsItem[];
}

export * from './api';

export enum PaymentMethodType {
	Cash = "cash",
	CreditCard = "credit_card",
}

export interface PaymentTaxLine {
	rate_bps: number;
	amount: number;
	label?: string;
	scope?: string;
}

export interface BookingPaymentTax {
	amount: number;
	mode_snapshot?: string;
	rate_bps: number;
	lines: BookingPaymentTaxLine[];
}

export interface BookingPaymentTaxLine {
	rate_bps: number;
	amount: number;
	label?: string;
	scope?: string;
}

export interface BookingPaymentPromoCode {
	id: string;
	code: string;
	type: string;
	value: number;
}


export type BookingPaymentProvider = {
	type: 'stripe';
	customer_id: string;
	payment_intent_id?: string;
};

export interface BookingPaymentRefund {
	id: string;
	total: number;
	provider_refund_id?: string;
	status: string;
	created_at: number;
}

export interface BookingPayment {
	currency: string;
	market: string;
	subtotal: number;
	discount: number;
	total: number;
	paid: number;
	tax?: BookingPaymentTax;
	promo_code?: BookingPaymentPromoCode;
	provider?: BookingPaymentProvider;
	refunds: BookingPaymentRefund[];
	payment_method_id?: string;
	method_type: PaymentMethodType;
}

export interface OrderPaymentTax {
	amount: number;
	mode_snapshot?: string;
	rate_bps: number;
	lines: OrderPaymentTaxLine[];
}

export interface OrderPaymentTaxLine {
	rate_bps: number;
	amount: number;
	label?: string;
	scope?: string;
}

export interface OrderPaymentPromoCode {
	id: string;
	code: string;
	type: string;
	value: number;
}


export type OrderPaymentProvider = {
	type: 'stripe';
	customer_id: string;
	payment_intent_id?: string;
};

export interface OrderPaymentRefund {
	id: string;
	total: number;
	provider_refund_id?: string;
	status: string;
	created_at: number;
}

export interface OrderPayment {
	currency: string;
	market: string;
	subtotal: number;
	shipping: number;
	discount: number;
	total: number;
	paid: number;
	tax?: OrderPaymentTax;
	promo_code?: OrderPaymentPromoCode;
	provider?: OrderPaymentProvider;
	refunds: OrderPaymentRefund[];
	zone_id?: string;
	payment_method_id?: string;
	shipping_method_id?: string;
	method_type: PaymentMethodType;
}

export interface PromoCodeValidation {
	promo_code_id: string;
	code: string;
	discounts: any[];
	conditions: any[];
}

export interface BookingQuote {
	market: string;
	zone: Zone | null;
	subtotal: number;
	discount: number;
	tax: number;
	total: number;
	payment_method: PaymentMethod | null;
	payment_methods: PaymentMethod[];
	promo_code: PromoCodeValidation | null;
	payment: BookingPayment;
	charge_amount: number;
	id?: string;
	expires_at?: number;
}

export interface OrderQuote {
	market: string;
	zone: Zone | null;
	subtotal: number;
	shipping: number;
	discount: number;
	tax: number;
	total: number;
	shipping_method: ShippingMethod | null;
	payment_method: PaymentMethod | null;
	payment_methods: PaymentMethod[];
	promo_code: PromoCodeValidation | null;
	payment: OrderPayment;
	charge_amount: number;
	id?: string;
	expires_at?: number;
}


export interface Price {
	currency: string;
	market: string;
	amount: number;
	compare_at?: number;
	audience_id?: string;
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
	compare_at?: number;
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
	postal_code: string;
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
	postal_code?: string | null;
}

export interface EshopCartItem {
	id: string;
	product_id: string;
	variant_id: string;
	product_name: string;
	product_slug: string;
	variant_attributes: Record<string, any>;
	price: Price;
	quantity: number;
	added_at: number;
	max_stock?: number;
}

export interface BookingCartItem {
	id: string;
	service_id: string;
	service_name: string;
	date: string;
	from: number;
	to: number;
	time_text: string;
	provider_id?: string;
	forms: any[];
}


export type IntegrationProvider =
	| { type: 'stripe'; secret_key?: string; publishable_key: string; webhook_secret?: string; currency: string }
	| { type: 'shippo'; api_token?: string }
	| { type: 'google'; client_id?: string; client_secret?: string; access_token?: string; refresh_token?: string;
		token_expires_at?: number; scopes: string[]; account_email?: string | null; connected_at: number }
	| { type: 'google_analytics4'; measurement_id: string }
	| { type: 'telegram_bot'; bot_token?: string }
	| { type: 'deep_seek'; api_key?: string; model?: string }

	| { type: 'open_ai'; api_key?: string; model?: string }
	| { type: 'slack'; api_key?: string }
	| { type: 'discord'; api_key?: string }
	| { type: 'whats_app'; api_key?: string }
	| { type: 'resend'; api_key?: string }
	| { type: 'send_grid'; api_key?: string }
	| { type: 'airtable'; api_key?: string }
	| { type: 'linear'; api_key?: string }
	| { type: 'git_hub'; api_key?: string }
	| { type: 'git_lab'; api_key?: string }
	| { type: 'dropbox'; api_key?: string }
	| { type: 'hub_spot'; api_key?: string }
	| { type: 'monday'; api_key?: string }
	| { type: 'click_up'; api_key?: string }
	| { type: 'pipedrive'; api_key?: string }
	| { type: 'calendly'; api_key?: string }
	| { type: 'typeform'; api_key?: string }
	| { type: 'webflow'; api_key?: string }
	| { type: 'trello'; api_key?: string }
	| { type: 'replicate'; api_key?: string }
	| { type: 'asana'; api_key?: string }
	| { type: 'brevo'; api_key?: string }
	| { type: 'intercom'; api_key?: string }
	| { type: 'notion'; api_key?: string }
	| { type: 'eleven_labs'; api_key?: string }
	| { type: 'active_campaign'; api_key?: string; account_url: string }
	| { type: 'shopify'; api_key?: string; store_domain: string }
	| { type: 'supabase'; api_key?: string; project_url: string }
	| { type: 'mailchimp'; api_key?: string }

	| { type: 'twilio'; account_sid?: string; auth_token?: string }
	| { type: 'jira'; email?: string; api_token?: string; domain: string }
	| { type: 'woo_commerce'; consumer_key?: string; consumer_secret?: string; store_url: string }
	| { type: 'freshdesk'; api_key?: string; domain: string }
	| { type: 'zendesk'; api_token?: string; email?: string; subdomain: string }

	| { type: 'salesforce'; access_token?: string; instance_url: string }
	| { type: 'zoom'; api_key?: string }
	| { type: 'microsoft_teams'; api_key?: string }
	| { type: 'firebase'; api_key?: string }
	| { type: 'arky'; api_key?: string }

	| { type: 'vercel_deploy_hook'; url?: string }
	| { type: 'netlify_deploy_hook'; url?: string }
	| { type: 'cloudflare_deploy_hook'; url?: string }
	| { type: 'custom_deploy_hook'; url?: string };


export interface Integration {
	id: string;
	business_id: string;
	key: string;
	provider: IntegrationProvider;
	created_at: number;
	updated_at: number;
}

export interface ShippingWeightTier {
	up_to_grams: number;
	amount: number;
}

export interface PaymentMethod {
	id: string;
	integration_id?: string;
}

export interface ShippingMethod {
	id: string;
	taxable: boolean;
	eta_text: string;
	location_id?: string;
	integration_id?: string;
	amount: number;
	free_above?: number;
	weight_tiers?: ShippingWeightTier[];
}

export interface Location {
	id: string;
	business_id: string;
	key: string;
	address: Address;
	is_pickup_location: boolean;
	created_at: number;
	updated_at: number;
}

export interface InventoryLevel {
	location_id: string;
	available: number;
	reserved: number;
}

export interface Zone {
	id: string;
	business_id: string;
	market_id: string;
	countries: string[];
	states: string[];
	postal_codes: string[];
	tax_bps: number;
	shipping_methods: ShippingMethod[];
}

export interface Market {
	id: string;
	business_id: string;
	key: string;
	currency: string;
	tax_mode: "exclusive" | "inclusive";
	payment_methods: PaymentMethod[];
	zones: Zone[];
	created_at: number;
	updated_at: number;
}

export interface Language {
	id: string;
}

export interface BusinessEmails {
	billing: string;
	support: string;
}

export type WebhookEventSubscription =
	| { event: 'node.created'; parent_id?: string }
	| { event: 'node.updated'; key?: string }
	| { event: 'node.deleted'; key?: string }
	| { event: 'order.created' }
	| { event: 'order.updated' }
	| { event: 'order.confirmed' }
	| { event: 'order.payment_received' }
	| { event: 'order.payment_failed' }
	| { event: 'order.refunded' }
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
	| { event: 'booking.payment_received' }
	| { event: 'booking.payment_failed' }
	| { event: 'booking.refunded' }
	| { event: 'booking.cancelled' }
	| { event: 'booking.item_cancelled' }
	| { event: 'booking.reminder' }
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
	business_id: string;
	key: string;
	url: string;
	events: WebhookEventSubscription[];
	headers: Record<string, string>;
	secret: string;
	enabled: boolean;
	created_at: number;
	updated_at: number;
}


export type BusinessSubscriptionStatus =
	| 'pending'
	| 'active'
	| 'cancellation_scheduled'
	| 'cancelled'
	| 'expired';

export type BusinessSubscriptionSource = 'signup' | 'admin' | 'import';

export type BusinessSubscriptionProvider = {
	type: 'stripe';
	customer_id: string;
	subscription_id?: string;
	price_id?: string;
};

export interface BusinessSubscriptionPayment {
	currency: string;
	market: string;
	provider?: BusinessSubscriptionProvider;
}

export interface BusinessSubscription {
	id: string;
	target: string;
	plan_id: string;
	pending_plan_id: string | null;
	payment: BusinessSubscriptionPayment;
	status: BusinessSubscriptionStatus;
	start_date: number;
	end_date: number;
	token: string;
	source: BusinessSubscriptionSource;
}

export type AudienceSubscriptionStatus =
	| 'pending'
	| 'active'
	| 'cancellation_scheduled'
	| 'cancelled'
	| 'expired';

export type AudienceSubscriptionSource = 'signup' | 'admin' | 'import';

export type AudienceSubscriptionProvider = {
	type: 'stripe';
	customer_id: string;
	subscription_id?: string;
	price_id?: string;
};

export interface AudienceSubscriptionPayment {
	currency: string;
	market: string;
	provider?: AudienceSubscriptionProvider;
}

export interface AudienceSubscription {
	id: string;
	business_id: string;
	customer_id: string;
	audience_id: string;
	plan_id: string;
	pending_plan_id: string | null;
	payment: AudienceSubscriptionPayment;
	status: AudienceSubscriptionStatus;
	start_date: number;
	end_date: number;
	token: string;
	source: AudienceSubscriptionSource;
	created_at: number;
	updated_at: number;
}

export interface Business {
	id: string;
	key: string;
	timezone: string;
	languages?: Language[];
	emails?: BusinessEmails;
	subscription?: BusinessSubscription;
	counts?: Record<string, number>;
}

export interface EshopStoreState {
	business_id: string;
	selected_shipping_method_id: string | null;
	user_token: string | null;
	processing_checkout: boolean;
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
	taxonomy_id: string;
	fields: TaxonomyField[];
}

export interface TaxonomyQuery {
	taxonomy_id: string;
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
	form_id: string;
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
	mime_type: string;
	title?: string | null;
	description?: string | null;
	alt?: string | null;
	entity: string;
	metadata?: string | null;
	created_at: number;
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
	current_step: number;
	total_steps: number;
	steps: Record<number, { name: string; label_key: string }>;
	weekdays: string[];
	month_year: string;
	days: any[];
	current: Date;
	selected_date: string | null;
	slots: any[];
	selected_slot: any | null;
	selected_provider: any | null;
	providers: any[];
	loading: boolean;
	start_date: string | null;
	end_date: string | null;
	guest_token: string | null;
	service: any | null;
	business: Business | null;
	currency: string;
	booking_forms: FormEntry[];
	api_url: string;
	business_id: string;
	timezone: string;
	tz_groups: any;
	items: BookingCartItem[];
	allowed_payment_methods: string[];
	payment_config: {
		provider: { publishable_key: string; currency: string } | null;
		enabled: boolean;
	};
}

export type BookingServiceStatus = 'active' | 'draft' | 'archived';
export type BookingProviderStatus = 'active' | 'draft' | 'archived';

export type ProductStatus = 'active' | 'draft' | 'archived';
export type CustomerStatus = 'active' | 'draft' | 'archived';
export type AudienceStatus = 'active' | 'draft' | 'archived';
export type AgentChatStatus = 'active' | 'draft' | 'archived';
export type WorkflowStatus = 'active' | 'draft' | 'archived';
export type PromoCodeStatus = 'active' | 'draft' | 'archived';
export type NodeStatus = 'active' | 'draft' | 'archived';
export type EmailTemplateStatus = 'active' | 'draft' | 'archived';
export type FormStatus = 'active' | 'draft' | 'archived';
export type TaxonomyStatus = 'active' | 'draft' | 'archived';

export type BookingCancellationReason =
	| 'admin_rejected'
	| 'customer_cancelled'
	| 'payment_failed'
	| 'expired'
	| 'other';

export type OrderCancellationReason =
	| 'admin_rejected'
	| 'customer_cancelled'
	| 'payment_failed'
	| 'expired'
	| 'other';

export type BookingItemStatus =
	| { status: 'pending'; expires_at: number }
	| { status: 'confirmed' }
	| { status: 'cancelled'; reason: BookingCancellationReason };

export type OrderItemStatus =
	| { status: 'pending'; expires_at: number }
	| { status: 'confirmed' }
	| { status: 'cancelled'; reason: OrderCancellationReason };

export type BookingPaymentStatus =
	| { status: 'pending'; at: number }
	| { status: 'authorized'; at: number; amount: number }
	| { status: 'captured'; at: number; amount: number }
	| { status: 'failed'; at: number; reason?: string };

export type OrderPaymentStatus =
	| { status: 'pending'; at: number }
	| { status: 'authorized'; at: number; amount: number }
	| { status: 'captured'; at: number; amount: number }
	| { status: 'failed'; at: number; reason?: string };

export interface BookingItemSnapshot {
	service_key: string;
	provider_key: string;
	price: Price;
}

export interface TimeRange {
	from: number;
	to: number;
}

export interface BookingItem {
	id: string;
	service_id: string;
	provider_id: string;
	business_id: string;
	booking_id: string;
	from: number;
	to: number;
	forms: FormEntry[];
	snapshot: BookingItemSnapshot;
	status: BookingItemStatus;
}

export interface Booking {
	id: string;
	number: string;
	customer_id: string;
	verified: boolean;
	forms: FormEntry[];
	business_id: string;
	service_ids: string[];
	provider_ids: string[];
	payment: BookingPayment;
	business?: Business;
	account?: any;
	items: BookingItem[];
	audience_id?: string;
	history?: { action: string; reason?: string; timestamp: number }[];
	fired_reminders: number[];
	created_at: number;
	last_modified: number;
}

export interface Node {
	id: string;
	key: string;
	business_id: string;
	parent_id?: string | null;
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	status: NodeStatus;
	slug: Record<string, string>;
	children: Node[];
	created_at: number;
	updated_at: number;
}

export interface EmailTemplate {
	id: string;
	key: string;
	business_id: string;
	subject: Record<string, string>;
	body: string;
	from_name: string;
	from_email: string;
	reply_to?: string;
	preheader?: string;
	status: EmailTemplateStatus;
	created_at: number;
	updated_at: number;
}

export interface Form {
	id: string;
	key: string;
	business_id: string;
	schema: FormSchema[];
	status: FormStatus;
	created_at: number;
	updated_at: number;
}

export interface FormSubmission {
	id: string;
	form_id: string;
	business_id: string;
	fields: FormField[];
	created_at: number;
}

export interface Taxonomy {
	id: string;
	key: string;
	business_id: string;
	parent_id?: string | null;
	schema?: TaxonomySchema[];
	status: TaxonomyStatus;
	created_at: number;
	updated_at: number;
}

export interface ServiceDuration {
	duration: number;
	is_pause?: boolean;
}

export interface ServiceProvider {
	id: string;
	provider_id: string;
	prices: Price[];
	durations: ServiceDuration[];
	audience_ids: string[];
	working_days: Array<{ day: string; working_hours: Array<{ from: number; to: number }> }>;
	specific_dates: Array<{ date: number; working_hours: Array<{ from: number; to: number }> }>;
	slot_interval: number;
	min_advance: number;
	max_advance: number;
	reminders: number[];
	forms?: FormEntry[];
}

export interface Service {
	id: string;
	key: string;
	slug: Record<string, string>;
	business_id: string;
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	created_at: number;
	updated_at: number;
	status: BookingServiceStatus;
}

export interface ProviderTimelinePoint {
	timestamp: number;
	booked: number;
}

export interface Provider {
	id: string;
	key: string;
	slug: Record<string, string>;
	business_id: string;
	status: BookingProviderStatus;
	audience_ids: string[];
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	timeline: ProviderTimelinePoint[];
	created_at: number;
	updated_at: number;
}

export interface WorkflowEdge {
	source: string;
	target: string;
	output: string;
	back_edge: boolean;
}

export interface Workflow {
	id: string;
	key: string;
	business_id: string;
	secret: string;
	status: WorkflowStatus;
	nodes: Record<string, WorkflowNode>;
	edges: WorkflowEdge[];

	schedule?: string;
	created_at: number;
	updated_at: number;
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
	delay_ms?: number;
	schema?: Block[];
}

export interface WorkflowHttpNode {
	type: 'http';
	method: WorkflowHttpMethod;
	url: string;
	headers?: Record<string, string>;
	body?: any;
	timeout_ms?: number;
	integration_id?: string;
	integration_provider_id?: string;
	delay_ms?: number;
	retries?: number;
	retry_delay_ms?: number;
}

export interface WorkflowSwitchRule {
	condition: string;
}

export interface WorkflowSwitchNode {
	type: 'switch';
	rules: WorkflowSwitchRule[];
	delay_ms?: number;
}

export interface WorkflowTransformNode {
	type: 'transform';
	code: string;
	delay_ms?: number;
}

export interface WorkflowLoopNode {
	type: 'loop';
	expression: string;
	delay_ms?: number;
}

export type WorkflowHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface NodeResult {
	output: any;
	route: string;
	started_at: number;
	completed_at: number;
	duration_ms: number;
	error?: string;
}

export interface WorkflowExecution {
	id: string;
	workflow_id: string;
	business_id: string;
	status: ExecutionStatus;
	input: Record<string, any>;
	results: Record<string, NodeResult>;
	error?: string;
	scheduled_at: number;
	started_at: number;
	completed_at?: number;
	created_at: number;
	updated_at: number;
}

export type AudienceType =
	| { type: 'standard' }
	| { type: 'confirmation'; confirm_template_id: string }
	| { type: 'paid'; prices: SubscriptionPrice[]; payment_integration_id?: string };

export interface Audience {
	id: string;
	business_id: string;
	key: string;
	status: AudienceStatus;
	type: AudienceType;
}

export interface AudienceAccessResponse {
	has_access: boolean;
	subscription?: AudienceSubscription;
}

export interface AudienceSubscribeResponse {
	checkout_url?: string;
	subscription?: AudienceSubscription;
}

export type EventAction =
	
	| { action: 'order_created' }
	| { action: 'order_updated' }
	| { action: 'order_confirmed' }
	| { action: 'order_payment_received'; data: { amount: number; currency: string } }
	| { action: 'order_payment_failed'; data: { reason?: string } }
	| { action: 'order_refunded'; data: { amount: number; currency: string; reason?: string } }
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
	| { action: 'booking_payment_received'; data: { amount: number; currency: string } }
	| { action: 'booking_payment_failed'; data: { reason?: string } }
	| { action: 'booking_refunded'; data: { amount: number; currency: string; reason?: string } }
	| { action: 'booking_cancelled'; data: { reason?: string } }
	| { action: 'booking_item_cancelled'; data: { item_id: string; refund_amount: number } }
	
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
	created_at: number;
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
	tracking_number?: string | null;
	tracking_url?: string | null;
	label_url?: string | null;
	status: ShippingStatus;
}


export interface ShipmentLine {
	order_item_id: string;
	quantity: number;
}


export interface Shipment {
	id: string;
	location_id: string;
	lines: ShipmentLine[];
	carrier?: string | null;
	service?: string | null;
	tracking_number?: string | null;
	tracking_url?: string | null;
	label_url?: string | null;
	status: ShippingStatus;
	created_at: number;
	updated_at: number;
}


export interface ShippingRate {
	id: string;
	provider: string;
	carrier: string;
	service: string;
	display_name: string;
	amount: number;
	currency: string;
	estimated_days?: number | null;
}


export type ShippingAddress = Address;


export interface Parcel {
	length: number;
	width: number;
	height: number;
	weight: number;
	distance_unit: 'in' | 'cm';
	mass_unit: 'oz' | 'lb' | 'g' | 'kg';
}


export interface PurchaseLabelResult {
	tracking_number: string;
	tracking_url?: string | null;
	label_url: string;
	carrier: string;
	service: string;
}


export interface ShipResult {
	shipment_id: string;
	tracking_number: string;
	tracking_url?: string | null;
	label_url: string;
}


export interface CustomsItem {
	description: string;
	quantity: number;
	net_weight: string;
	mass_unit: string;
	value_amount: string;
	value_currency: string;
	origin_country: string;
	tariff_number?: string | null;
}


export interface CustomsDeclaration {
	contents_type: string;
	contents_explanation?: string | null;
	non_delivery_option: string;
	certify: boolean;
	certify_signer: string;
	items: CustomsItem[];
}

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
	profile_id: string;
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
	discounts: import('./api').Discount[];
	conditions: import('./api').Condition[];
}

export interface OrderQuote {
	id?: string;
	expires_at?: number;
	market: string;
	zone: Zone | null;
	items: QuoteLine[];
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
}


export interface Price {
	currency: string;
	market: string;
	amount: number;
	compare_at?: number;
	profile_list_id?: string;
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
	name?: string | null;
	company?: string | null;
	street1?: string | null;
	street2?: string | null;
	city?: string | null;
	state?: string | null;
	postal_code?: string | null;
	country?: string | null;
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

export type CartStatus = 'active' | 'abandoned' | 'converted' | 'expired';
export type CartOrigin = 'storefront' | 'admin';

export interface Cart {
	id: string;
	store_id: string;
	profile_id: string;
	token: string;
	status: CartStatus;
	origin: CartOrigin;
	created_by_account_id?: string | null;
	market: string;
	items: import('./api').OrderCheckoutItemInput[];
	shipping_address?: Address | null;
	billing_address?: Address | null;
	forms: FormEntry[];
	promo_code?: string | null;
	payment_method_id?: string | null;
	shipping_method_id?: string | null;
	quote_snapshot?: OrderQuote | null;
	converted_order_id?: string | null;
	item_count: number;
	last_activity_at: number;
	abandoned_at?: number | null;
	recovery_sent_at?: number | null;
	created_at: number;
	updated_at: number;
}

export type IntegrationProvider =
	| { type: 'stripe'; secret_key?: string; publishable_key: string; webhook_secret?: string; currency: string }
	| { type: 'shippo'; api_token?: string }
	| { type: 'google'; client_id?: string; client_secret?: string; access_token?: string; refresh_token?: string;
		token_expires_at?: number; scopes: string[]; account_email?: string | null; connected_at: number }
	| { type: 'telegram_bot'; bot_token?: string }
	| { type: 'deep_seek'; api_key?: string; model?: string }
	| { type: 'brave_search'; api_key?: string }

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
	store_id: string;
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
	store_id: string;
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

export interface ProductInventory {
	id: string;
	store_id: string;
	product_id: string;
	variant_id: string;
	location_id: string;
	available: number;
	reserved: number;
	updated_at: number;
}

export interface ProductVariant {
	id: string;
	sku?: string;
	prices: Price[];
	inventory: ProductInventory[];
	attributes: Block[];
	weight?: number;
}

export interface Product {
	id: string;
	store_id: string;
	key: string;
	slug: Record<string, string>;
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	filters?: TaxonomyEntry[];
	variants: ProductVariant[];
	status: ProductStatus;
	created_at: number;
	updated_at: number;
}

export interface GalleryItem {
	id: string;
	url: string;
	alt?: string;
	caption?: string;
}

export interface ProductLineItemSnapshot {
	product_key: string;
	variant_sku?: string;
	variant_attributes: Block[];
	price: Price;
}

export interface ServiceLineItemSnapshot {
	service_key: string;
	provider_key: string;
	price: Price;
}

export type OrderItemSnapshot = ProductLineItemSnapshot | ServiceLineItemSnapshot;

export type ProductQuoteLineAvailability =
	| { ok: true; available?: number }
	| { ok: false; reason: string };

export type ServiceQuoteLineAvailability =
	| { ok: true; spots: number }
	| { ok: false; reason: string };

export interface ProductQuoteLine {
	type: 'product';
	line_id: string;
	product_id: string;
	variant_id: string;
	quantity: number;
	unit_price: number;
	subtotal: number;
	discount: number;
	tax: number;
	total: number;
	snapshot: ProductLineItemSnapshot;
	availability: ProductQuoteLineAvailability;
}

export interface ServiceQuoteLine {
	type: 'service';
	line_id: string;
	service_id: string;
	provider_id: string;
	from: number;
	to: number;
	quantity: 1;
	unit_price: number;
	subtotal: number;
	discount: number;
	tax: number;
	total: number;
	snapshot: ServiceLineItemSnapshot;
	availability: ServiceQuoteLineAvailability;
}

export type QuoteLine = ProductQuoteLine | ServiceQuoteLine;

export interface ProductLineItem {
	type: 'product';
	id: string;
	product_id: string;
	variant_id: string;
	quantity: number;
	location_id?: string;
	snapshot: ProductLineItemSnapshot;
	status: OrderItemStatus;
}

export interface ServiceLineItem {
	type: 'service';
	id: string;
	service_id: string;
	provider_id: string;
	from: number;
	to: number;
	forms: FormEntry[];
	snapshot: ServiceLineItemSnapshot;
	status: OrderItemStatus;
}

export type OrderItem = ProductLineItem | ServiceLineItem;

export interface HistoryEntry {
	action: string;
	reason?: string;
	timestamp: number;
}

export interface Order {
	id: string;
	number: string;
	store_id: string;
	source_cart_id: string;
	profile_id: string;
	status: OrderStatus;
	verified: boolean;
	items: OrderItem[];
	payment: OrderPayment;
	shipping_address?: Address;
	billing_address?: Address;
	forms: FormEntry[];
	shipments: Shipment[];
	history: HistoryEntry[];
	profile_list_id?: string;
	fired_reminders: number[];
	created_at: number;
	updated_at: number;
}

export interface OrderCheckoutResult {
	order_id: string;
	number: string;
	client_secret: string | null;
	payment: OrderPayment;
}

export interface Zone {
	id: string;
	store_id: string;
	market_id: string;
	countries: string[];
	states: string[];
	postal_codes: string[];
	tax_bps: number;
	shipping_methods: ShippingMethod[];
}

export interface Market {
	id: string;
	store_id: string;
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

export interface StoreEmails {
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
	| { event: 'order.reminder' }
	| { event: 'order.shipment_created' }
	| { event: 'order.shipment_in_transit' }
	| { event: 'order.shipment_out_for_delivery' }
	| { event: 'order.shipment_delivered' }
	| { event: 'order.shipment_failed' }
	| { event: 'order.shipment_returned' }
	| { event: 'order.shipment_status_changed' }
	| { event: 'cart.created' }
	| { event: 'cart.updated' }
	| { event: 'cart.abandoned' }
	| { event: 'cart.converted' }
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
	| { event: 'store.created' }
	| { event: 'store.updated' }
	| { event: 'store.deleted' }
	| { event: 'profile_list.created' }
	| { event: 'profile_list.updated' }
	| { event: 'profile_list.profile_added' }
	| { event: 'profile_list.profile_pending' }
	| { event: 'profile_list.profile_confirmed' }
	| { event: 'profile_list.profile_cancelled' }
	| { event: 'account.updated' };

export interface Webhook {
	id: string;
	store_id: string;
	key: string;
	url: string;
	events: WebhookEventSubscription[];
	headers: Record<string, string>;
	secret: string;
	enabled: boolean;
	created_at: number;
	updated_at: number;
}


export type StoreSubscriptionStatus =
	| 'pending'
	| 'active'
	| 'cancellation_scheduled'
	| 'cancelled'
	| 'expired';

export type StoreSubscriptionSource = 'signup' | 'admin' | 'import';

export type StoreSubscriptionProvider = {
	type: 'stripe';
	profile_id: string;
	subscription_id?: string;
	price_id?: string;
};

export interface StoreSubscriptionPayment {
	currency: string;
	market: string;
	provider?: StoreSubscriptionProvider;
}

export interface StoreSubscription {
	id: string;
	target: string;
	plan_id: string;
	pending_plan_id: string | null;
	payment: StoreSubscriptionPayment;
	status: StoreSubscriptionStatus;
	start_date: number;
	end_date: number;
	token: string;
	source: StoreSubscriptionSource;
}

export type ProfileListMembershipProvider = {
	type: 'stripe';
	stripe_customer_id: string;
	subscription_id?: string;
	price_id?: string;
};

export interface ProfileListMembershipPayment {
	currency: string;
	market: string;
	provider?: ProfileListMembershipProvider;
}

export interface Store {
	id: string;
	key: string;
	timezone: string;
	languages?: Language[];
	emails?: StoreEmails;
	subscription?: StoreSubscription;
	counts?: Record<string, number>;
}

export interface EshopStoreState {
	store_id: string;
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
	store_id: string;
	entity?: string;
	metadata?: string | null;
	created_at: number;
	slug: Record<string, string>;
}

export interface SubscriptionPlan {
	id: string;
	provider_price_id?: string | null;
	provider_product_id?: string | null;
	name: string;
	tier: number;
	amount: number;
	currency: string;
	interval: string;
	interval_count: number;
	trial_period_days: number;
}

export interface AccountToken {
	id: string;
	value?: string;
	name?: string | null;
	created_at: number;
	expires_at?: number | null;
	type?: string;
}

export interface StoreMembership {
	store_id: string;
	role: import('./api').StoreRole;
	invitation_token?: AccountToken | null;
	joined_at?: number | null;
}

export interface AccountLifecycle {
	last_login_at?: number | null;
	onboarding_completed: boolean;
}

export interface Account {
	id: string;
	email: string;
	memberships: StoreMembership[];
	api_tokens: AccountToken[];
	auth_tokens?: import('./api').AuthToken[];
	verification_codes?: unknown[];
	lifecycle?: AccountLifecycle;
}

export interface AccountUpdateResponse {
	success: boolean;
	newly_created_tokens: AccountToken[];
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	cursor?: string;
	total?: number;
}

export interface PaginatedResponse<T> {
	items: T[];
	cursor: string | null;
	data?: T[];
	meta?: {
		total: number;
		page: number;
		per_page: number;
	};
}

export type ServiceStatus = 'active' | 'draft' | 'archived';
export type ProviderStatus = 'active' | 'draft' | 'archived';

export type ProductStatus = 'active' | 'draft' | 'archived';
export type ProfileStatus = 'active' | 'archived';
export type ProfileListStatus = 'active' | 'draft' | 'archived';
export type ProfileListSource = 'manual' | 'import' | 'signup' | 'admin' | 'system';
export type ProfileListMembershipStatus =
	| 'pending'
	| 'active'
	| 'cancellation_scheduled'
	| 'cancelled'
	| 'expired'
	| 'archived';
export type MailboxStatus = 'active' | 'draft' | 'archived';
export type MailboxPreset = 'gmail' | 'zoho' | 'microsoft' | 'custom';
export type MailboxConnectionSecurity = 'tls' | 'start_tls';
export type MailboxSyncStatus = 'not_ready' | 'ready' | 'failed';
export type SmtpImapMailboxProvider = {
	type: 'smtp_imap';
	preset: MailboxPreset;
	smtp_host: string;
	smtp_port: number;
	smtp_security: MailboxConnectionSecurity;
	imap_host: string;
	imap_port: number;
	imap_security: MailboxConnectionSecurity;
	username: string;
	password_configured: boolean;
	sync_enabled: boolean;
	sync_interval_seconds: number;
	sync_status?: MailboxSyncStatus;
	sync_error?: string | null;
	sync_ready_at?: number | null;
	last_synced_at?: number | null;
	last_seen_uid?: number | null;
};
export type MailboxProvider = { type: 'fake' } | SmtpImapMailboxProvider;
export type OutreachCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type OutreachEnrollmentStatus =
	| 'pending'
	| 'active'
	| 'replied'
	| 'completed'
	| 'suppressed'
	| 'failed'
	| 'cancelled';
export type OutreachMessageStatus = 'pending' | 'sending' | 'sent' | 'bounced' | 'failed' | 'skipped';
export type OutreachMessageKind = 'sequence_step' | 'manual_reply';
export type OutreachMessageCopySource = 'base' | 'generated' | 'edited';
export type OutreachMessageReviewStatus = 'unreviewed' | 'reviewed';
export type OutreachThreadMode = 'new_thread' | 'same_thread';
export type OutreachStepVariantStatus = 'active' | 'archived';
export type OutreachPersonalizationStatus = 'idle' | 'running' | 'completed' | 'failed';
export type SuppressionStatus = 'active' | 'archived';
export type SuppressionTargetType = 'email' | 'domain' | 'profile';
export type SuppressionScopeType = 'store' | 'outreach_campaign';
export type SuppressionReason = 'manual' | 'unsubscribed' | 'bounced' | 'complained' | 'replied';
export type SuppressionSource = 'admin' | 'import' | 'reply' | 'system';
export type WorkflowStatus = 'active' | 'draft' | 'archived';
export type PromoCodeStatus = 'active' | 'draft' | 'archived';
export type NodeStatus = 'active' | 'draft' | 'archived';
export type EmailTemplateStatus = 'active' | 'draft' | 'archived';

export type FormStatus = 'active' | 'draft' | 'archived';
export type TaxonomyStatus = 'active' | 'draft' | 'archived';

export type OrderCancellationReason =
	| 'admin_rejected'
	| 'profile_cancelled'
	| 'payment_failed'
	| 'expired'
	| 'other';

export type OrderItemStatus =
	| { status: 'pending'; expires_at: number }
	| { status: 'confirmed' }
	| { status: 'cancelled'; reason: OrderCancellationReason };

export type OrderStatus =
	| 'pending'
	| 'partially_confirmed'
	| 'confirmed'
	| 'partially_cancelled'
	| 'cancelled';

export type OrderPaymentStatus =
	| { status: 'pending'; at: number }
	| { status: 'authorized'; at: number; amount: number }
	| { status: 'captured'; at: number; amount: number }
	| { status: 'failed'; at: number; reason?: string };

export interface TimeRange {
	from: number;
	to: number;
}

export interface Node {
	id: string;
	key: string;
	store_id: string;
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
	store_id: string;
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
	store_id: string;
	schema: FormSchema[];
	status: FormStatus;
	created_at: number;
	updated_at: number;
}

export interface FormSubmission {
	id: string;
	form_id: string;
	store_id: string;
	profile_id: string;
	fields: FormField[];
	created_at: number;
}

export interface Taxonomy {
	id: string;
	key: string;
	store_id: string;
	parent_id?: string | null;
	schema?: TaxonomySchema[];
	status: TaxonomyStatus;
	created_at: number;
	updated_at: number;
}

export interface ServiceDuration {
	duration: number;
	is_pause: boolean;
}

export interface WorkingHour {
	from: number;
	to: number;
}

export interface WorkingDay {
	day: string;
	working_hours: WorkingHour[];
}

export interface SpecificDate {
	date: number;
	working_hours: WorkingHour[];
}

export interface ServiceProvider {
	id: string;
	service_id: string;
	provider_id: string;
	store_id: string;
	working_days: WorkingDay[];
	specific_dates: SpecificDate[];
	prices: Price[];
	durations: ServiceDuration[];
	slot_interval: number;
	forms: FormEntry[];
	reminders: number[];
	min_advance: number;
	max_advance: number;
	created_at: number;
	updated_at: number;
}

export interface Service {
	id: string;
	key: string;
	slug: Record<string, string>;
	store_id: string;
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	filters?: TaxonomyEntry[];
	created_at: number;
	updated_at: number;
	status: ServiceStatus;
}


export interface ProviderTimelinePoint {
	timestamp: number;
	booked: number;
}

export interface Provider {
	id: string;
	key: string;
	slug: Record<string, string>;
	store_id: string;
	status: ProviderStatus;
	blocks: Block[];
	taxonomies: TaxonomyEntry[];
	filters?: TaxonomyEntry[];
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
	store_id: string;
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
	store_id: string;
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

export type ProfileListType =
	| { type: 'standard' }
	| { type: 'confirmation'; confirm_template_id?: string | null }
	| { type: 'paid'; prices: SubscriptionPrice[]; payment_integration_id?: string | null };

export interface ProfileListAccessResponse {
	has_access: boolean;
	membership?: ProfileListMembership | null;
}

export interface ProfileListSubscribeResponse {
	checkout_url?: string | null;
	membership?: ProfileListMembership | null;
}

export interface ProfileList {
	id: string;
	store_id: string;
	key: string;
	name: string;
	description?: string | null;
	status: ProfileListStatus;
	type: ProfileListType;
	source: ProfileListSource;
	member_count: number;
	created_at: number;
	updated_at: number;
}

export interface ProfileListMembership {
	profile_list_id: string;
	source: ProfileListSource;
	fields: Record<string, unknown>;
	lead_description?: string | null;
	status: ProfileListMembershipStatus;
	plan_id: string;
	pending_plan_id: string | null;
	payment: ProfileListMembershipPayment;
	start_date: number;
	end_date: number;
	token: string;
	created_at: number;
	updated_at: number;
}

export interface Mailbox {
	id: string;
	store_id: string;
	key: string;
	email: string;
	from_name: string;
	reply_to_email?: string | null;
	provider: MailboxProvider;
	status: MailboxStatus;
	daily_limit: number;
	sent_today: number;
	last_sent_at?: number | null;
	created_at: number;
	updated_at: number;
}

export interface OutreachStepVariant {
	id?: string;
	position?: number;
	weight: number;
	name?: string;
	subject: string;
	body: string;
	status?: OutreachStepVariantStatus;
}

export interface OutreachStep {
	id?: string;
	position?: number;
	delay_seconds?: number;
	variants: OutreachStepVariant[];
	thread_mode?: OutreachThreadMode;
	attachments?: string[];
}

export interface OutreachPersonalizationCounters {
	total_profiles: number;
	draft_messages: number;
	generated_messages: number;
	base_messages: number;
	failed_messages: number;
}

export interface OutreachPersonalizationState {
	status: OutreachPersonalizationStatus;
	model_integration_id?: string | null;
	step_position?: number | null;
	profile_ids: string[];
	overwrite: boolean;
	instructions?: string | null;
	error?: string | null;
	counters: OutreachPersonalizationCounters;
	started_at?: number | null;
	completed_at?: number | null;
}

export interface OutreachCampaign {
	id: string;
	store_id: string;
	key: string;
	name: string;
	mailbox_ids: string[];
	status: OutreachCampaignStatus;
	steps: OutreachStep[];
	personalization: OutreachPersonalizationState;
	launched_at?: number | null;
	created_at: number;
	updated_at: number;
}

export interface OutreachCampaignLaunchReadiness {
	ready: boolean;
	blockers: string[];
	warnings: string[];
	profile_count: number;
	sender_count: number;
	step_count: number;
	daily_capacity: number;
	expected_drafts: number;
	draft_count: number;
	pending_drafts: number;
	generated_drafts: number;
	base_drafts: number;
	edited_drafts: number;
	reviewed_drafts: number;
	unreviewed_drafts: number;
	personalization_errors: number;
	stale_drafts: number;
	suppression_count: number;
}

export interface OutreachCampaignRecipientImportResult {
	imported_count: number;
	existing_count: number;
	skipped_count: number;
	draft_count: number;
}

export interface OutreachEnrollment {
	id: string;
	store_id: string;
	outreach_campaign_id: string;
	profile_id: string;
	mailbox_id?: string | null;
	lead_description?: string | null;
	fields: Record<string, unknown>;
	status: OutreachEnrollmentStatus;
	current_step_position: number;
	next_send_at?: number | null;
	replied_at?: number | null;
	completed_at?: number | null;
	created_at: number;
	updated_at: number;
}

export interface OutreachMessage {
	id: string;
	store_id: string;
	outreach_campaign_id: string;
	outreach_enrollment_id: string;
	profile_id: string;
	mailbox_id: string;
	kind: OutreachMessageKind;
	step_id?: string | null;
	step_position?: number | null;
	step_variant_id?: string | null;
	step_variant_position?: number | null;
	step_variant_name?: string | null;
	base_copy_hash?: string | null;
	copy_source: OutreachMessageCopySource;
	review_status: OutreachMessageReviewStatus;
	personalized_at?: number | null;
	edited_at?: number | null;
	personalization_error?: string | null;
	in_reply_to_outreach_reply_id?: string | null;
	status: OutreachMessageStatus;
	to_email: string;
	from_email: string;
	subject: string;
	body: string;
	provider_message_id?: string | null;
	provider_thread_id?: string | null;
	error?: string | null;
	sent_at?: number | null;
	created_at: number;
	updated_at: number;
}

export interface OutreachReply {
	id: string;
	store_id: string;
	outreach_campaign_id: string;
	outreach_enrollment_id: string;
	outreach_message_id: string;
	profile_id: string;
	mailbox_id: string;
	from_email: string;
	subject?: string | null;
	body?: string | null;
	provider_message_id?: string | null;
	provider_thread_id?: string | null;
	received_at: number;
	created_at: number;
	updated_at: number;
}

export interface Suppression {
	id: string;
	store_id: string;
	outreach_campaign_id?: string | null;
	profile_id?: string | null;
	email?: string | null;
	domain?: string | null;
	target_type: SuppressionTargetType;
	target_key: string;
	scope_type: SuppressionScopeType;
	scope_key: string;
	reason: SuppressionReason;
	status: SuppressionStatus;
	source: SuppressionSource;
	created_at: number;
	updated_at: number;
}

export type LeadGenerationThreadStatus =
	| 'draft'
	| 'running'
	| 'needs_review'
	| 'ready_to_import'
	| 'imported'
	| 'failed'
	| 'cancelled';

export type LeadStatus =
	| 'accepted'
	| 'needs_review'
	| 'rejected'
	| 'imported';

export type LeadEmailClassification =
	| 'official_domain'
	| 'role_official'
	| 'personal_official'
	| 'free_mail'
	| 'unusable'
	| 'unknown';

export type LeadValidationCheckStatus = 'passed' | 'warning' | 'failed' | 'unknown';

export interface LeadGenerationThread {
	id: string;
	store_id: string;
	integration_id: string;
	title?: string | null;
	status: LeadGenerationThreadStatus;
	error?: string | null;
	started_at?: number | null;
	completed_at?: number | null;
	created_at: number;
	updated_at: number;
}

export interface LeadValidationCheck {
	key: string;
	status: LeadValidationCheckStatus;
	message: string;
}

export interface LeadEmailValidationResult {
	email: string;
	normalized_email?: string | null;
	domain?: string | null;
	classification: LeadEmailClassification;
	confidence: number;
	importable: boolean;
	hard_blockers: string[];
	checks: LeadValidationCheck[];
}

export interface Lead {
	id: string;
	store_id: string;
	thread_id: string;
	company_name?: string | null;
	contact_name?: string | null;
	website_url?: string | null;
	email: string;
	normalized_email: string;
	email_source_url: string;
	source_excerpt?: string | null;
	classification: LeadEmailClassification;
	confidence: number;
	validation_checks: LeadValidationCheck[];
	hard_blockers: string[];
	status: LeadStatus;
	profile_id?: string | null;
	import_error?: string | null;
	fields: Record<string, unknown>;
	created_at: number;
	updated_at: number;
}

export interface ImportLeadsResult {
	imported: number;
	failed: number;
	skipped: number;
	profile_list_id?: string | null;
	errors: string[];
	skipped_reasons: string[];
}

export interface LeadGenerationMessage {
	id: string;
	role: string;
	content: string;
	created_at: number;
}

export interface SendLeadGenerationMessageResult {
	response: string;
	thread: LeadGenerationThread;
	leads: Lead[];
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
	
	| { action: 'store_created' }
	| { action: 'store_updated' }
	| { action: 'store_deleted' }
	
	| { action: 'profile_list_created' }
	| { action: 'profile_list_updated' }
	| { action: 'profile_list_profile_added' }
	| { action: 'profile_list_profile_removed' }
	| { action: 'profile_list_profile_pending' }
	| { action: 'profile_list_profile_confirmed' }
	| { action: 'profile_list_profile_cancelled' };

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

export interface PromoCode {
	id: string;
	store_id: string;
	code: string;
	discounts: import('./api').Discount[];
	conditions: import('./api').Condition[];
	status: PromoCodeStatus;
	uses: number;
	created_at: number;
	updated_at: number;
}

import type {
	Account,
	Contact,
	PaginatedResponse,
	ProductVariant,
	SocialProviderCapability,
	StorefrontGetSupportConversationParams,
	StorefrontSendSupportMessageParams,
	SupportConversationStartResponse,
	WorkflowHttpNode,
	WorkflowTool,
	WorkflowTriggerNode
} from '../../dist/index.js';
import { SDK_VERSION } from '../../dist/index.js';

const sdkVersionLiteral: '0.9.15' = SDK_VERSION;

declare const supportStart: SupportConversationStartResponse;
const supportCapability: string = supportStart.support_token;

const storefrontSupportMessage: StorefrontSendSupportMessageParams = {
	conversation_id: 'conversation-contract',
	support_token: 'a'.repeat(64),
	operation_id: '018f477d-1cae-7c12-bf12-123456789abc',
	input: { type: 'text', content: 'Help' }
};

const storefrontSupportRead: StorefrontGetSupportConversationParams = {
	conversation_id: 'conversation-contract',
	support_token: 'a'.repeat(64),
	message_limit: 25
};

// @ts-expect-error storefront support messages require the capability token.
const supportMessageWithoutCapability: StorefrontSendSupportMessageParams = {
	conversation_id: 'conversation-contract',
	operation_id: '018f477d-1cae-7c12-bf12-123456789abc',
	input: { type: 'text', content: 'Help' }
};

declare const account: Account;
declare const contact: Contact;
declare const productVariant: ProductVariant;
// @ts-expect-error verification challenges are never part of the public account contract.
account.verification_codes;
// @ts-expect-error verification challenges are never part of the public contact contract.
contact.verification_codes;
// @ts-expect-error variant order, not an is_default field, defines the configured default.
productVariant.is_default;

const trigger: WorkflowTriggerNode = {
	type: 'trigger',
	delay_ms: 0
};

const triggerWithLegacyEvent: WorkflowTriggerNode = {
	type: 'trigger',
	// @ts-expect-error trigger nodes do not select an event.
	event: 'order.created'
};

const getNode: WorkflowHttpNode = {
	type: 'http',
	method: 'get',
	url: 'https://api.example.test/orders',
	headers: { Accept: 'application/json' },
	timeout_ms: 30_000,
	delay_ms: 0,
	retries: 3,
	retry_delay_ms: 1_000
};

const mutationNode: WorkflowHttpNode = {
	type: 'http',
	method: 'post',
	url: 'https://api.example.test/orders',
	headers: { 'Content-Type': 'application/json' },
	body: { id: 'order-1' },
	timeout_ms: 30_000,
	delay_ms: 0,
	retries: 0,
	retry_delay_ms: 0
};

// @ts-expect-error required HTTP timing and header fields cannot be omitted.
const missingHttpFields: WorkflowHttpNode = {
	type: 'http',
	method: 'get',
	url: 'https://api.example.test/orders',
	retries: 0,
	retry_delay_ms: 0
};

// @ts-expect-error mutating HTTP nodes require a literal zero retry count.
const retryingMutation: WorkflowHttpNode = {
	type: 'http',
	method: 'delete',
	url: 'https://api.example.test/orders/order-1',
	headers: {},
	timeout_ms: 30_000,
	delay_ms: 0,
	retries: 1,
	retry_delay_ms: 0
};

// @ts-expect-error mutating HTTP nodes require a literal zero retry delay.
const delayedMutationRetry: WorkflowHttpNode = {
	type: 'http',
	method: 'patch',
	url: 'https://api.example.test/orders/order-1',
	headers: { 'Content-Type': 'application/json' },
	timeout_ms: 30_000,
	delay_ms: 0,
	retries: 0,
	retry_delay_ms: 1_000
};

const canonicalPage: PaginatedResponse<{ id: string }> = {
	items: [{ id: 'item-1' }],
	cursor: 'cursor-2'
};

const tiktokConnectionOnlyCapability: SocialProviderCapability = {
	type: 'tiktok_account',
	display_name: 'TikTok Account',
	icon_key: 'tiktok_account',
	publishing_supported: false,
	required_scopes: ['user.info.basic'],
	media_requirements: [],
	engagement: {
		read_comments: false,
		reply_to_comments: false
	},
	analytics: {
		read_post_metrics: false
	}
};

// @ts-expect-error provider capabilities must state whether publishing is supported.
const missingPublishingCapability: SocialProviderCapability = {
	type: 'x_account',
	display_name: 'X Account',
	icon_key: 'x_account',
	required_scopes: [],
	media_requirements: [],
	engagement: {
		read_comments: true,
		reply_to_comments: true
	},
	analytics: {
		read_post_metrics: true
	}
};

const legacyDataPage: PaginatedResponse<{ id: string }> = {
	items: [],
	cursor: null,
	// @ts-expect-error legacy data pages are not part of PaginatedResponse.
	data: []
};

const legacyMetaPage: PaginatedResponse<{ id: string }> = {
	items: [],
	cursor: null,
	// @ts-expect-error legacy metadata wrappers are not part of PaginatedResponse.
	meta: { total: 0 }
};

const workflowToolWireDto: WorkflowTool = {
	id: 'arky',
	name: 'Arky',
	description: 'Arky workflow operations',
	icon: 'arky',
	color: '#000000',
	category: 'core',
	configuration_required: false,
	docs_url: 'https://arky.io/docs',
	url_patterns: ['^https://api\\.arky\\.io/'],
	resources: [],
	triggers: [
		{
			name: 'Order created',
			value: 'order.created',
			description: 'An order was created',
			webhook_type: 'incoming'
		}
	]
};

const camelCaseWorkflowTool: WorkflowTool = {
	...workflowToolWireDto,
	// @ts-expect-error the wire DTO is snake_case.
	configurationRequired: false
};

void [
	supportStart,
	supportCapability,
	storefrontSupportMessage,
	storefrontSupportRead,
	supportMessageWithoutCapability,
	account,
	contact,
	productVariant,
	trigger,
	triggerWithLegacyEvent,
	getNode,
	mutationNode,
	missingHttpFields,
	retryingMutation,
	delayedMutationRetry,
	canonicalPage,
	tiktokConnectionOnlyCapability,
	missingPublishingCapability,
	legacyDataPage,
	legacyMetaPage,
	workflowToolWireDto,
	camelCaseWorkflowTool
];
void sdkVersionLiteral;

import assert from 'node:assert/strict';
import test from 'node:test';

import {
	collectBlockReferences,
	getBlockContentValue,
	getBlockTextValue,
	selectLocalizedText,
} from '../dist/storefront.js';

test('LocalizedText selects only the requested or explicitly configured default language', () => {
	const translations = { en: 'Shirt', 'sr-Latn-BA': 'Košulja', ja: 'シャツ' };
	const block = { id: 'name', key: 'name', type: 'localized_text', value: translations };
	assert.equal(selectLocalizedText(translations, 'sr-Latn-BA', 'en'), 'Košulja');
	assert.equal(selectLocalizedText(translations, 'ja', 'en'), 'シャツ');
	assert.equal(selectLocalizedText(translations, 'de', 'en'), 'Shirt');
	assert.equal(selectLocalizedText(translations, 'de'), null);
	assert.equal(selectLocalizedText(translations, 'sr-latn-ba'), null);
	assert.equal(selectLocalizedText(translations, 'toString'), null);
	assert.equal(selectLocalizedText(null, 'en'), null);
	assert.equal(getBlockTextValue(block, 'sr-Latn-BA'), 'Košulja');
	assert.equal(getBlockTextValue(block, 'de'), '');
	assert.equal(getBlockTextValue(block, 'de', 'en'), 'Shirt');
	assert.equal(getBlockTextValue({ ...block, value: null }, 'en'), '');
	assert.deepEqual(block.value, translations);
});

test('LocalizedText is decoded recursively without treating translation keys as Block references', () => {
	const localized = { id: 'name', key: 'name', type: 'localized_text', value: { en: 'Shirt', de: 'Hemd' } };
	const entry = { blocks: [{ id: 'items', key: 'items', type: 'array', value: [
		{ id: 'item', key: 'item', type: 'object', value: [localized] },
	] }] };
	assert.deepEqual(getBlockContentValue(entry, 'items', 'de'), [{ name: 'Hemd' }]);
	assert.deepEqual(getBlockContentValue(entry, 'items', 'fr'), [{ name: null }]);
	assert.deepEqual(getBlockContentValue(entry, 'items', 'fr', 'en'), [{ name: 'Shirt' }]);
	assert.deepEqual(collectBlockReferences(entry.blocks), { mediaIds: [], entryIds: [], formIds: [], productIds: [] });
});

test('LocalizedMarkdown blocks and plain Markdown use the same explicit language rule', () => {
	const body = { id: 'body', key: 'body', type: 'localized_markdown', value: { en: '# Welcome', it: '# Benvenuto' } };
	assert.equal(getBlockTextValue(body, 'it'), '# Benvenuto');
	assert.equal(getBlockTextValue(body, 'de'), '');
	assert.equal(getBlockTextValue(body, 'de', 'en'), '# Welcome');
	assert.equal(getBlockContentValue({ blocks: [body] }, 'body', 'it'), '# Benvenuto');
	assert.equal(
		getBlockContentValue({ blocks: [{ id: 'scalar', key: 'scalar', type: 'markdown', value: '# Scalar' }] }, 'scalar', 'it'),
		'# Scalar',
	);
});

test('block content decodes localized nested objects and repeated values', () => {
	const entry = {
		blocks: [{
			id: 'info',
			key: 'info',
			type: 'object',
			value: [
				{ id: 'title', key: 'title', type: 'localized_text', value: { en: 'English', 'sr-latn': 'Srpski' } },
				{
					id: 'author',
					key: 'author',
					type: 'object',
					value: [{ id: 'role', key: 'role', type: 'text', value: 'Developer' }],
				},
				{
					id: 'features',
					key: 'features',
					type: 'array',
					value: [
						{ id: 'one', key: 'feature', type: 'text', value: 'CMS' },
						{ id: 'two', key: 'feature', type: 'text', value: 'Commerce' },
					],
				},
			],
		}],
	};

	assert.deepEqual(getBlockContentValue(entry, 'info', 'sr-latn'), {
		title: 'Srpski',
		author: { role: 'Developer' },
		features: ['CMS', 'Commerce'],
	});
});

test('block content decodes repeated structured array items as objects', () => {
	const entry = {
		blocks: [{
			id: 'faq',
			key: 'faq',
			type: 'array',
			value: [{
				id: 'faq-one',
				key: 'item',
				type: 'object',
				value: [
					{ id: 'question', key: 'question', type: 'text', value: 'Why?' },
					{ id: 'answer', key: 'answer', type: 'localized_text', value: { en: 'Because.' } },
				],
			}],
		}],
	};

	assert.deepEqual(getBlockContentValue(entry, 'faq', 'en'), [
		{ question: 'Why?', answer: 'Because.' },
	]);
	assert.equal(getBlockContentValue(entry, 'missing', 'en'), null);
});

test('block references are collected recursively by resource type without hydration', () => {
	const blocks = [
		{ id: 'hero', key: 'hero', type: 'media', value: 'media-1' },
		{ id: 'empty', key: 'empty', type: 'media', value: null },
		{
			id: 'related',
			key: 'related',
			type: 'array',
			value: [
				{ id: 'article', key: 'article', type: 'entry', value: 'entry-1' },
				{ id: 'contact', key: 'contact', type: 'form', value: 'form-1' },
				{ id: 'product', key: 'product', type: 'product', value: 'product-1' },
				{
					id: 'nested',
					key: 'nested',
					type: 'object',
					value: [
						{ id: 'download', key: 'download', type: 'product', value: 'product-2' },
						{ id: 'duplicate-hero', key: 'duplicate_hero', type: 'media', value: 'media-1' },
					],
				},
			],
		},
	];

	assert.deepEqual(collectBlockReferences(blocks), {
		mediaIds: ['media-1'],
		entryIds: ['entry-1'],
		formIds: ['form-1'],
		productIds: ['product-1', 'product-2'],
	});
});

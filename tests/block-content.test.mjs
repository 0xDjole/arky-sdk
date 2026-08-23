import assert from 'node:assert/strict';
import test from 'node:test';

import {
	collectBlockReferences,
	getBlockContentValue,
	getBlockTextValue,
	selectLocalizedObjectText,
} from '../dist/storefront.js';

function localizedObject(values) {
	return {
		id: 'localized',
		key: 'title',
		type: 'object',
		properties: {},
		value: Object.fromEntries(
			Object.entries(values).map(([locale, value]) => [
				locale,
				{ id: locale, key: locale, type: 'text', properties: {}, value },
			]),
		),
	};
}

test('localized Object/Text blocks follow one explicit fallback order', () => {
	const value = localizedObject({ bs: 'Bosanski', en: 'English', it: 'Italiano' });

	assert.equal(selectLocalizedObjectText(value, 'it', ['bs', 'en']), 'Italiano');
	assert.equal(selectLocalizedObjectText(value, 'de', ['bs', 'en']), 'Bosanski');
	assert.equal(selectLocalizedObjectText(localizedObject({ fr: 'Français' }), 'de', ['en']), 'Français');
	assert.equal(selectLocalizedObjectText(localizedObject({}), 'de', ['en'], 'Missing'), 'Missing');
	assert.equal(getBlockTextValue(value, 'bs'), 'Bosanski');
});

test('block content decodes localized nested objects and repeated values', () => {
	const entry = {
		blocks: [{
			id: 'info',
			key: 'info',
			type: 'array',
			properties: {},
			value: [
				{
					id: 'title',
					key: 'title',
					type: 'object',
					properties: {},
					value: {
						en: { id: 'en', key: 'en', type: 'text', properties: {}, value: 'English' },
						'sr-latn': {
							id: 'sr-latn',
							key: 'sr-latn',
							type: 'text',
							properties: {},
							value: 'Srpski',
						},
					},
				},
				{
					id: 'author',
					key: 'author',
					type: 'object',
					properties: {},
					value: {
						role: { id: 'role', key: 'role', type: 'text', properties: {}, value: 'Developer' },
					},
				},
				{
					id: 'features',
					key: 'features',
					type: 'array',
					properties: {},
					value: [
						{ id: 'one', key: 'feature', type: 'text', properties: {}, value: 'CMS' },
						{ id: 'two', key: 'feature', type: 'text', properties: {}, value: 'Commerce' },
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

test('block content decodes repeated structured array items', () => {
	const entry = {
		blocks: [{
			id: 'faq',
			key: 'faq',
			type: 'array',
			value: [{
				id: 'faq-one',
				key: 'item',
				type: 'array',
				value: [
					{ id: 'question', key: 'question', type: 'text', value: 'Why?' },
					{ id: 'answer', key: 'answer', type: 'text', value: 'Because.' },
				],
			}],
		}],
	};

	assert.deepEqual(getBlockContentValue(entry, 'faq'), [
		{ question: 'Why?', answer: 'Because.' },
	]);
});

test('block references are collected recursively by resource type without hydration', () => {
	const blocks = [
		{ id: 'hero', key: 'hero', type: 'media', properties: {}, value: 'media-1' },
		{
			id: 'related',
			key: 'related',
			type: 'array',
			properties: {},
			value: [
				{ id: 'article', key: 'article', type: 'entry', properties: {}, value: 'entry-1' },
				{ id: 'product', key: 'product', type: 'product', properties: {}, value: 'product-1' },
				{
					id: 'nested',
					key: 'nested',
					type: 'object',
					properties: {},
					value: {
						download: {
							id: 'download',
							key: 'download',
							type: 'digital_product',
							properties: {},
							value: 'digital-1',
						},
						duplicateHero: {
							id: 'duplicate-hero',
							key: 'duplicate_hero',
							type: 'media',
							properties: {},
							value: 'media-1',
						},
					},
				},
			],
		},
	];

	assert.deepEqual(collectBlockReferences(blocks), {
		mediaIds: ['media-1'],
		entryIds: ['entry-1'],
		productIds: ['product-1'],
		digitalProductIds: ['digital-1'],
	});
});

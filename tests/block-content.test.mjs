import assert from 'node:assert/strict';
import test from 'node:test';

import { getBlockContentValue } from '../dist/storefront.js';

test('block content decodes localized nested objects and repeated values', () => {
	const entry = {
		blocks: [{
			id: 'info',
			key: 'info',
			type: 'array',
			value: [
				{
					id: 'title',
					key: 'title',
					type: 'localized_text',
					value: { en: 'English', 'sr-latn': 'Srpski' },
				},
				{
					id: 'author',
					key: 'author',
					type: 'object',
					value: {
						role: { id: 'role', key: 'role', type: 'text', value: 'Developer' },
					},
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

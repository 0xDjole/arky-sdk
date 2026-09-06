import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdmin } from '../dist/admin.js';

const arky = createAdmin({
	baseUrl: 'https://api.example.com',
	storeId: 'store',
	market: 'us',
});

test('formats the current date block type as a localized date', () => {
	const timestamp = Date.UTC(2024, 0, 2);
	const block = {
		id: 'date',
		key: 'published_at',
		type: 'date',
		value: timestamp,
	};

	assert.equal(arky.utils.formatBlockValue(block), new Date(timestamp).toLocaleDateString());
});

test('formats a propertyless number block as its numeric value', () => {
	const timestamp = Date.UTC(2024, 0, 2);
	const block = {
		id: 'number',
		key: 'quantity',
		type: 'number',
		value: timestamp,
	};

	assert.equal(arky.utils.formatBlockValue(block), String(timestamp));
});

test('date helpers preserve zero, negative and early-epoch milliseconds', () => {
	for (const value of [-1, 0, 1, 1_700_000_000, 1_704_164_645_678]) {
		const block = { id: 'date', key: 'date', type: 'date', value };
		assert.equal(arky.utils.formatBlockValue(block), new Date(value).toLocaleDateString());
		assert.equal(arky.utils.formatDate(value, 'en'), new Date(value).toLocaleDateString('en-US', {
			timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric',
		}));
	}
	for (const value of [0.1, '1704164645678', Number.MAX_SAFE_INTEGER + 1]) {
		assert.throws(() => arky.utils.formatBlockValue({ id: 'date', key: 'date', type: 'date', value }), RangeError);
	}
});

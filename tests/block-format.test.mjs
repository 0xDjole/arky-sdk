import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdmin } from '../dist/admin.js';

const arky = createAdmin({
	baseUrl: 'https://api.example.com',
	storeId: 'store',
	market: 'us',
});

test('formats the current date block type as a localized date', () => {
	const timestamp = Math.floor(Date.UTC(2024, 0, 2) / 1000);
	const block = {
		id: 'date',
		key: 'published_at',
		type: 'date',
		properties: {},
		value: timestamp,
	};

	assert.equal(arky.utils.formatBlockValue(block), new Date(timestamp * 1000).toLocaleDateString());
});

test('number block properties do not change numeric formatting', () => {
	const timestamp = Date.UTC(2024, 0, 2);
	const block = {
		id: 'number',
		key: 'quantity',
		type: 'number',
		properties: { variant: 'DATE' },
		value: timestamp,
	};

	assert.equal(arky.utils.formatBlockValue(block), String(timestamp));
});

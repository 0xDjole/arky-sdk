import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdmin } from '../dist/admin.js';

const arky = createAdmin({
	baseUrl: 'https://api.example.com',
	apiToken: 'arky_api_block_format',
});

test('formats a calendar date block as that day in the explicit locale, independent of the time zone', () => {
	const block = { id: 'date', key: 'published_at', type: 'date', value: '2024-01-02' };
	assert.equal(
		arky.utils.formatBlockValue(block, 'en-US'),
		new Date(Date.UTC(2024, 0, 2)).toLocaleDateString('en-US', { timeZone: 'UTC' }),
	);
	assert.equal(arky.utils.formatBlockValue(block, 'en-US'), '1/2/2024');
	assert.equal(arky.utils.formatBlockValue({ ...block, value: null }, 'en-US'), '');
});

test('formats a date-time block from epoch milliseconds in the explicit locale', () => {
	const timestamp = Date.UTC(2024, 0, 2, 12, 30);
	const block = { id: 'moment', key: 'starts_at', type: 'date_time', value: timestamp };
	assert.equal(arky.utils.formatBlockValue(block, 'en-US'), new Date(timestamp).toLocaleString('en-US'));
});

test('formats a propertyless number block as its numeric value', () => {
	const timestamp = Date.UTC(2024, 0, 2);
	const block = {
		id: 'number',
		key: 'quantity',
		type: 'number',
		value: timestamp,
	};

	assert.equal(arky.utils.formatBlockValue(block, 'en'), String(timestamp));
});

test('date helpers preserve zero, negative and early-epoch milliseconds', () => {
	for (const value of [-1, 0, 1, 1_700_000_000, 1_704_164_645_678]) {
		assert.equal(arky.utils.formatDate(value, 'en'), new Date(value).toLocaleDateString('en-US', {
			timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric',
		}));
	}
	for (const value of [0.1, Number.MAX_SAFE_INTEGER + 1]) {
		assert.throws(() => arky.utils.formatDate(value, 'en'), RangeError);
	}
});

test('localized and structured blocks format through the explicit language without inventing one', () => {
	const localized = { id: 'title', key: 'title', type: 'localized_text', value: { bs: 'Naslov', en: 'Title' } };
	assert.equal(arky.utils.formatBlockValue(localized, 'bs'), 'Naslov');
	assert.equal(arky.utils.formatBlockValue(localized, 'de'), '');
	assert.equal(arky.utils.formatBlockValue(localized, 'de', 'en'), 'Title');
	assert.equal(arky.utils.formatBlockValue({ id: 'geo', key: 'geo', type: 'geo_location', value: { lat: 43.85, lon: 18.41 } }, 'en'), '43.85, 18.41');
	assert.equal(arky.utils.formatBlockValue({ id: 'list', key: 'list', type: 'array', value: [] }, 'en'), '');
	assert.equal(arky.utils.formatBlockValue({ id: 'group', key: 'group', type: 'object', value: [] }, 'en'), '');
});

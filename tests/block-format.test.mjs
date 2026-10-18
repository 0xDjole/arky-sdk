import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdmin } from '../dist/admin.js';
import * as storefront from '../dist/storefront.js';
import * as utils from '../dist/utils.js';
import { formatBlockValue } from '../dist/utils.js';

test('formats a calendar date block as that day in the explicit locale, independent of the time zone', () => {
	const block = { id: 'date', key: 'published_at', type: 'date', value: '2024-01-02' };
	assert.equal(
		formatBlockValue(block, 'en-US'),
		new Date(Date.UTC(2024, 0, 2)).toLocaleDateString('en-US', { timeZone: 'UTC' }),
	);
	assert.equal(formatBlockValue(block, 'en-US'), '1/2/2024');
	assert.equal(formatBlockValue({ ...block, value: null }, 'en-US'), '');
});

test('formats a date-time block from epoch milliseconds in the explicit locale', () => {
	const timestamp = Date.UTC(2024, 0, 2, 12, 30);
	const block = { id: 'moment', key: 'starts_at', type: 'date_time', value: timestamp };
	assert.equal(formatBlockValue(block, 'en-US'), new Date(timestamp).toLocaleString('en-US'));
});

test('formats a propertyless number block as its numeric value', () => {
	const timestamp = Date.UTC(2024, 0, 2);
	const block = {
		id: 'number',
		key: 'quantity',
		type: 'number',
		value: timestamp,
	};

	assert.equal(formatBlockValue(block, 'en'), String(timestamp));
});

test('the helpers are module exports, with no utils object on a client and no English-only date, text, phone or SVG helpers', () => {
	const admin = createAdmin({ apiUrl: 'https://api.example.com', secretKey: 'arky_api_block_format' });
	assert.equal('utils' in admin, false);
	assert.equal(typeof storefront.formatBlockValue, 'function');
	for (const removed of ['formatDate', 'slugify', 'humanize', 'categorify', 'validatePhoneNumber', 'fetchSvgContent', 'getSvgContentForAstro', 'injectSvgIntoElement', 'nameToKey', 'tzGroups', 'findTimeZone', 'getBlockObjectValues', 'getBlockFromArray', 'extractBlockValues']) {
		assert.equal(removed in utils, false, removed);
		assert.equal(removed in storefront, false, removed);
	}
});

test('localized and structured blocks format through the explicit language without inventing one', () => {
	const localized = { id: 'title', key: 'title', type: 'localized_text', value: { bs: 'Naslov', en: 'Title' } };
	assert.equal(formatBlockValue(localized, 'bs'), 'Naslov');
	assert.equal(formatBlockValue(localized, 'de'), '');
	assert.equal(formatBlockValue(localized, 'de', 'en'), 'Title');
	assert.equal(formatBlockValue({ id: 'geo', key: 'geo', type: 'geo_location', value: { lat: 43.85, lon: 18.41 } }, 'en'), '43.85, 18.41');
	assert.equal(formatBlockValue({ id: 'list', key: 'list', type: 'array', value: [] }, 'en'), '');
	assert.equal(formatBlockValue({ id: 'group', key: 'group', type: 'object', value: [] }, 'en'), '');
});

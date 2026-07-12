import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
	ExclusiveLockManager,
	MemoryStorage
} from './helpers/provider-operation-fixtures.mjs';

let importNonce = 0;

async function importProviderOperations() {
	const url = new URL('../dist/utils.js', import.meta.url);
	url.searchParams.set('provider-operation-test', String(++importNonce));
	return import(url.href);
}

const originalDescriptors = new Map(
	['localStorage', 'navigator'].map((name) => [
		name,
		Object.getOwnPropertyDescriptor(globalThis, name)
	])
);

function installGlobal(name, value) {
	Object.defineProperty(globalThis, name, {
		configurable: true,
		writable: true,
		value
	});
}

function restoreGlobals() {
	for (const [name, descriptor] of originalDescriptors) {
		if (descriptor) Object.defineProperty(globalThis, name, descriptor);
		else delete globalThis[name];
	}
}

afterEach(restoreGlobals);

function installBrowserState(storage = new MemoryStorage(), locks = new ExclusiveLockManager()) {
	installGlobal('localStorage', storage);
	installGlobal('navigator', { locks });
	return { storage, locks };
}

test('provider operations persist the immutable request and reuse it after a module remount', async () => {
	const { storage } = installBrowserState();
	const firstModule = await importProviderOperations();
	const storageKey = 'arky:order-refund:store-1:order-1';
	const request = { order_id: 'order-1', amount: 1250 };

	const first = await firstModule.withProviderOperationLock(storageKey, 'refund', async () =>
		firstModule.providerOperationFor(storageKey, request, 'refund')
	);
	const envelope = JSON.parse(storage.getItem(storageKey));
	assert.deepEqual(Object.keys(envelope).sort(), ['operation_id', 'request_json']);
	assert.equal(envelope.request_json, JSON.stringify(request));
	assert.equal(envelope.operation_id, first.operation_id);

	const remountedModule = await importProviderOperations();
	const remounted = await remountedModule.withProviderOperationLock(
		storageKey,
		'refund',
		async () => remountedModule.providerOperationFor(storageKey, request, 'refund')
	);
	assert.equal(remounted.operation_id, first.operation_id);
	assert.deepEqual(remountedModule.providerOperationRequest(remounted), request);
	assert.notEqual(storage.getItem(storageKey), null, 'a read or remount must not clear the operation');
});

test('provider operation storage fails closed for unavailable, corrupt, unreadable, or unverifiable state', async (t) => {
	const operations = await importProviderOperations();
	const storageKey = 'arky:provider:test-storage';
	const request = { action: 'charge', amount: 500 };

	await t.test('unavailable localStorage', () => {
		Object.defineProperty(globalThis, 'localStorage', {
			configurable: true,
			get() {
				throw new Error('blocked');
			}
		});
		assert.throws(
			() => operations.providerOperationFor(storageKey, request, 'payment'),
			/persistent operation storage is unavailable/
		);
	});

	for (const [name, raw] of [
		['invalid JSON', '{'],
		['invalid envelope', JSON.stringify({ operation_id: 'operation-only' })],
		[
			'invalid saved request',
			JSON.stringify({ operation_id: 'operation-1', request_json: '{' })
		]
	]) {
		await t.test(name, () => {
			const storage = new MemoryStorage();
			storage.seed(storageKey, raw);
			installBrowserState(storage);
			assert.throws(
				() => operations.providerOperationFor(storageKey, request, 'payment'),
				(error) =>
					error?.name === 'ProviderOperationStorageError' &&
					/corrupt|invalid/.test(error.message)
			);
		});
	}

	await t.test('unreadable state', () => {
		installBrowserState(new MemoryStorage({ readError: new Error('read failed') }));
		assert.throws(
			() => operations.providerOperationFor(storageKey, request, 'payment'),
			/operation state cannot be read/
		);
	});

	await t.test('unwritable state', () => {
		installBrowserState(new MemoryStorage({ writeError: new Error('write failed') }));
		assert.throws(
			() => operations.providerOperationFor(storageKey, request, 'payment'),
			/operation state cannot be saved/
		);
	});

	await t.test('discarded write fails read-back verification', () => {
		installBrowserState(new MemoryStorage({ discardWrites: true }));
		assert.throws(
			() => operations.providerOperationFor(storageKey, request, 'payment'),
			/operation state was not saved/
		);
	});
});

test('provider operation clear verifies the exact saved state and physical removal', async (t) => {
	const operations = await importProviderOperations();
	const storageKey = 'arky:provider:test-clear';
	const request = { action: 'refund', amount: 250 };

	await t.test('exact state is physically removed', () => {
		const storage = new MemoryStorage();
		installBrowserState(storage);
		const saved = operations.providerOperationFor(storageKey, request, 'refund');
		operations.clearProviderOperation(saved, 'refund');
		assert.equal(storage.getItem(storageKey), null);
	});

	await t.test('missing state is not accepted as a clear', () => {
		installBrowserState();
		assert.throws(
			() =>
				operations.clearProviderOperation(
					{ storageKey, request_json: JSON.stringify(request), operation_id: 'missing' },
					'refund'
				),
			/saved operation state is missing/
		);
	});

	await t.test('changed state cannot be cleared', () => {
		installBrowserState();
		const saved = operations.providerOperationFor(storageKey, request, 'refund');
		assert.throws(
			() => operations.clearProviderOperation({ ...saved, operation_id: 'different' }, 'refund'),
			/saved operation state changed/
		);
	});

	await t.test('remove failure retains the operation', () => {
		const storage = new MemoryStorage({ removeError: new Error('remove failed') });
		installBrowserState(storage);
		const saved = operations.providerOperationFor(storageKey, request, 'refund');
		assert.throws(
			() => operations.clearProviderOperation(saved, 'refund'),
			/could not be cleared/
		);
		assert.notEqual(storage.getItem(storageKey), null);
	});

	await t.test('discarded remove fails read-back verification', () => {
		const storage = new MemoryStorage({ discardRemoves: true });
		installBrowserState(storage);
		const saved = operations.providerOperationFor(storageKey, request, 'refund');
		assert.throws(
			() => operations.clearProviderOperation(saved, 'refund'),
			/was not cleared/
		);
		assert.notEqual(storage.getItem(storageKey), null);
	});
});

test('unavailable or contended Web Locks execute zero protected tasks', async (t) => {
	const operations = await importProviderOperations();
	const storageKey = 'arky:provider:test-lock';

	await t.test('unavailable Web Locks', async () => {
		installGlobal('navigator', {});
		let calls = 0;
		await assert.rejects(
			operations.withProviderOperationLock(storageKey, 'payment', async () => {
				calls += 1;
			}),
			/cross-tab operation locking is unavailable/
		);
		assert.equal(calls, 0);
	});

	await t.test('immediate contention', async () => {
		installGlobal('navigator', {
			locks: { request: async (_name, _options, callback) => callback(null) }
		});
		let calls = 0;
		await assert.rejects(
			operations.withProviderOperationLock(storageKey, 'payment', async () => {
				calls += 1;
			}),
			/already running in another tab/
		);
		assert.equal(calls, 0);
	});

	await t.test('a second tab is rejected while the first request owns the lock', async () => {
		const locks = new ExclusiveLockManager();
		installGlobal('navigator', { locks });
		let releaseFirst;
		let markEntered;
		const entered = new Promise((resolve) => (markEntered = resolve));
		const gate = new Promise((resolve) => (releaseFirst = resolve));
		let firstCalls = 0;
		let secondCalls = 0;

		const first = operations.withProviderOperationLock(storageKey, 'payment', async () => {
			firstCalls += 1;
			markEntered();
			await gate;
		});
		await entered;
		await assert.rejects(
			operations.withProviderOperationLock(storageKey, 'payment', async () => {
				secondCalls += 1;
			}),
			/already running in another tab/
		);
		releaseFirst();
		await first;
		assert.equal(firstCalls, 1);
		assert.equal(secondCalls, 0);
	});
});

test('the exact saved shipping request survives a changed signed rate and can be resumed', async () => {
	const { storage } = installBrowserState();
	const operations = await importProviderOperations();
	const storageKey = 'arky:shipping-label:store-1:order-1';
	const originalRequest = {
		order_id: 'order-1',
		rate_id: 'signed-rate-original',
		carrier: 'USPS',
		service: 'priority',
		location_id: 'location-1',
		fulfillment_order_id: 'fulfillment-1',
		lines: [
			{
				order_item_id: 'item-1',
				fulfillment_order_line_id: 'line-1',
				quantity: 2
			}
		]
	};
	const saved = operations.providerOperationFor(
		storageKey,
		originalRequest,
		'shipping-label purchase'
	);

	let changedRequestCalls = 0;
	await assert.rejects(
		operations.withProviderOperationLock(storageKey, 'shipping-label purchase', async () => {
			operations.providerOperationFor(
				storageKey,
				{ ...originalRequest, rate_id: 'signed-rate-after-remount' },
				'shipping-label purchase'
			);
			changedRequestCalls += 1;
		}),
		/different saved operation still needs review/
	);
	assert.equal(changedRequestCalls, 0);
	const remounted = operations.readProviderOperation(storageKey, 'shipping-label purchase');
	assert.equal(remounted.operation_id, saved.operation_id);
	assert.deepEqual(operations.providerOperationRequest(remounted), originalRequest);
	assert.notEqual(storage.getItem(storageKey), null, 'an unrelated order state must retain the request');
});

test('provider operations never reuse an in-memory fallback after durable storage changes', async () => {
	const operations = await importProviderOperations();
	const storageKey = 'arky:provider:no-memory-fallback';
	const request = { order_id: 'order-1', amount: 500 };
	const firstStorage = new MemoryStorage();
	installGlobal('localStorage', firstStorage);
	const first = operations.providerOperationFor(storageKey, request, 'refund');
	const secondStorage = new MemoryStorage();
	installGlobal('localStorage', secondStorage);
	const second = operations.providerOperationFor(storageKey, request, 'refund');
	assert.notEqual(second.operation_id, first.operation_id);
	assert.equal(firstStorage.getItem(storageKey) !== null, true);
	assert.equal(secondStorage.getItem(storageKey) !== null, true);
});

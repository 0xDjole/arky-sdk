import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  ExclusiveLockManager,
  MemoryStorage,
} from "./helpers/durable-request-fixtures.mjs";

let importNonce = 0;

async function importDurableRequests() {
  const url = new URL("../dist/utils.js", import.meta.url);
  url.searchParams.set("durable-request-test", String(++importNonce));
  return import(url.href);
}

const originalDescriptors = new Map(
  ["localStorage", "navigator"].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ]),
);

function installGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function restoreGlobals() {
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

afterEach(restoreGlobals);

function installBrowserState(
  storage = new MemoryStorage(),
  locks = new ExclusiveLockManager(),
) {
  installGlobal("localStorage", storage);
  installGlobal("navigator", { locks });
  return { storage, locks };
}

test("durable requests persist the immutable request and reuse it after a module remount", async () => {
  const { storage } = installBrowserState();
  const firstModule = await importDurableRequests();
  const storageKey = "arky:order-refund:store-1:order-1";
  const request = { order_id: "order-1", refund_id: "refund-1", amount: 1250 };

  const first = await firstModule.withDurableRequestLock(
    storageKey,
    "refund",
    async () =>
      firstModule.getOrCreateDurableRequest(storageKey, request, "refund"),
  );
  const envelope = JSON.parse(storage.getItem(storageKey));
  assert.deepEqual(Object.keys(envelope), ["requestJson"]);
  assert.equal(envelope.requestJson, JSON.stringify(request));

  const remountedModule = await importDurableRequests();
  const remounted = await remountedModule.withDurableRequestLock(
    storageKey,
    "refund",
    async () =>
      remountedModule.getOrCreateDurableRequest(storageKey, request, "refund"),
  );
  assert.equal(remounted.requestJson, first.requestJson);
  assert.deepEqual(remountedModule.durableRequestPayload(remounted), request);
  assert.notEqual(
    storage.getItem(storageKey),
    null,
    "a read or remount must not clear the operation",
  );
});

test("durable request storage fails closed for unavailable, corrupt, unreadable, or unverifiable state", async (t) => {
  const operations = await importDurableRequests();
  const storageKey = "arky:provider:test-storage";
  const request = { action: "charge", amount: 500 };

  await t.test("unavailable localStorage", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    assert.throws(
      () =>
        operations.getOrCreateDurableRequest(storageKey, request, "payment"),
      /durable request storage is unavailable/,
    );
  });

  for (const [name, raw] of [
    ["invalid JSON", "{"],
    ["invalid envelope", JSON.stringify({ unexpected: "operation-only" })],
    ["invalid saved request", JSON.stringify({ requestJson: "{" })],
  ]) {
    await t.test(name, () => {
      const storage = new MemoryStorage();
      storage.seed(storageKey, raw);
      installBrowserState(storage);
      assert.throws(
        () =>
          operations.getOrCreateDurableRequest(storageKey, request, "payment"),
        (error) =>
          error?.name === "DurableRequestStorageError" &&
          /corrupt|invalid/.test(error.message),
      );
    });
  }

  await t.test("unreadable state", () => {
    installBrowserState(
      new MemoryStorage({ readError: new Error("read failed") }),
    );
    assert.throws(
      () =>
        operations.getOrCreateDurableRequest(storageKey, request, "payment"),
      /durable request state cannot be read/,
    );
  });

  await t.test("unwritable state", () => {
    installBrowserState(
      new MemoryStorage({ writeError: new Error("write failed") }),
    );
    assert.throws(
      () =>
        operations.getOrCreateDurableRequest(storageKey, request, "payment"),
      /durable request state cannot be saved/,
    );
  });

  await t.test("discarded write fails read-back verification", () => {
    installBrowserState(new MemoryStorage({ discardWrites: true }));
    assert.throws(
      () =>
        operations.getOrCreateDurableRequest(storageKey, request, "payment"),
      /durable request state was not saved/,
    );
  });
});

test("durable request clear verifies the exact saved state and physical removal", async (t) => {
  const operations = await importDurableRequests();
  const storageKey = "arky:provider:test-clear";
  const request = { action: "refund", refund_id: "refund-1", amount: 250 };

  await t.test("exact state is physically removed", () => {
    const storage = new MemoryStorage();
    installBrowserState(storage);
    const saved = operations.getOrCreateDurableRequest(
      storageKey,
      request,
      "refund",
    );
    operations.clearDurableRequest(saved, "refund");
    assert.equal(storage.getItem(storageKey), null);
  });

  await t.test("missing state is not accepted as a clear", () => {
    installBrowserState();
    assert.throws(
      () =>
        operations.clearDurableRequest(
          { storageKey, requestJson: JSON.stringify(request) },
          "refund",
        ),
      /durable request state changed before it could be cleared/,
    );
  });

  await t.test("changed state cannot be cleared", () => {
    const storage = new MemoryStorage();
    installBrowserState(storage);
    const saved = operations.getOrCreateDurableRequest(
      storageKey,
      request,
      "refund",
    );
    storage.seed(
      storageKey,
      JSON.stringify({
        requestJson: JSON.stringify({ ...request, amount: 251 }),
      }),
    );
    assert.throws(
      () => operations.clearDurableRequest(saved, "refund"),
      /durable request state changed before it could be cleared/,
    );
  });

  await t.test("remove failure retains the operation", () => {
    const storage = new MemoryStorage({
      removeError: new Error("remove failed"),
    });
    installBrowserState(storage);
    const saved = operations.getOrCreateDurableRequest(
      storageKey,
      request,
      "refund",
    );
    assert.throws(
      () => operations.clearDurableRequest(saved, "refund"),
      /could not be cleared/,
    );
    assert.notEqual(storage.getItem(storageKey), null);
  });

  await t.test("discarded remove fails read-back verification", () => {
    const storage = new MemoryStorage({ discardRemoves: true });
    installBrowserState(storage);
    const saved = operations.getOrCreateDurableRequest(
      storageKey,
      request,
      "refund",
    );
    assert.throws(
      () => operations.clearDurableRequest(saved, "refund"),
      /was not cleared/,
    );
    assert.notEqual(storage.getItem(storageKey), null);
  });
});

test("unavailable or contended Web Locks execute zero protected tasks", async (t) => {
  const operations = await importDurableRequests();
  const storageKey = "arky:provider:test-lock";

  await t.test("unavailable Web Locks", async () => {
    installGlobal("navigator", {});
    let calls = 0;
    await assert.rejects(
      operations.withDurableRequestLock(storageKey, "payment", async () => {
        calls += 1;
      }),
      /cross-tab lock is unavailable/,
    );
    assert.equal(calls, 0);
  });

  await t.test("immediate contention", async () => {
    installGlobal("navigator", {
      locks: { request: async (_name, _options, callback) => callback(null) },
    });
    let calls = 0;
    await assert.rejects(
      operations.withDurableRequestLock(storageKey, "payment", async () => {
        calls += 1;
      }),
      /already active in another tab/,
    );
    assert.equal(calls, 0);
  });

  await t.test(
    "a second tab is rejected while the first request owns the lock",
    async () => {
      const locks = new ExclusiveLockManager();
      installGlobal("navigator", { locks });
      let releaseFirst;
      let markEntered;
      const entered = new Promise((resolve) => (markEntered = resolve));
      const gate = new Promise((resolve) => (releaseFirst = resolve));
      let firstCalls = 0;
      let secondCalls = 0;

      const first = operations.withDurableRequestLock(
        storageKey,
        "payment",
        async () => {
          firstCalls += 1;
          markEntered();
          await gate;
        },
      );
      await entered;
      await assert.rejects(
        operations.withDurableRequestLock(storageKey, "payment", async () => {
          secondCalls += 1;
        }),
        /already active in another tab/,
      );
      releaseFirst();
      await first;
      assert.equal(firstCalls, 1);
      assert.equal(secondCalls, 0);
    },
  );
});

test("the exact saved shipping request survives a changed signed rate and can be resumed", async () => {
  const { storage } = installBrowserState();
  const operations = await importDurableRequests();
  const storageKey = "arky:shipping-label:store-1:order-1";
  const originalRequest = {
    order_id: "order-1",
    shipment_id: "shipment-1",
    rate_id: "signed-rate-original",
    location_id: "location-1",
    fulfillment_order_id: "fulfillment-1",
    lines: [
      {
        order_product_id: "product-1",
        fulfillment_order_line_id: "line-1",
        quantity: 2,
      },
    ],
  };
  const saved = operations.getOrCreateDurableRequest(
    storageKey,
    originalRequest,
    "shipping-label purchase",
  );

  let changedRequestCalls = 0;
  await assert.rejects(
    operations.withDurableRequestLock(
      storageKey,
      "shipping-label purchase",
      async () => {
        operations.getOrCreateDurableRequest(
          storageKey,
          { ...originalRequest, rate_id: "signed-rate-after-remount" },
          "shipping-label purchase",
        );
        changedRequestCalls += 1;
      },
    ),
    /different unresolved payload/,
  );
  assert.equal(changedRequestCalls, 0);
  const remounted = operations.readDurableRequest(
    storageKey,
    "shipping-label purchase",
  );
  assert.equal(remounted.requestJson, saved.requestJson);
  assert.deepEqual(
    operations.durableRequestPayload(remounted),
    originalRequest,
  );
  assert.notEqual(
    storage.getItem(storageKey),
    null,
    "an unrelated order state must retain the request",
  );
});

test("durable requests never reuse an in-memory fallback after durable storage changes", async () => {
  const operations = await importDurableRequests();
  const storageKey = "arky:provider:no-memory-fallback";
  const request = { order_id: "order-1", refund_id: "refund-1", amount: 500 };
  const firstStorage = new MemoryStorage();
  installGlobal("localStorage", firstStorage);
  const first = operations.getOrCreateDurableRequest(
    storageKey,
    request,
    "refund",
  );
  const secondStorage = new MemoryStorage();
  installGlobal("localStorage", secondStorage);
  const second = operations.getOrCreateDurableRequest(
    storageKey,
    request,
    "refund",
  );
  assert.notStrictEqual(second, first);
  assert.equal(second.requestJson, first.requestJson);
  assert.equal(firstStorage.getItem(storageKey) !== null, true);
  assert.equal(secondStorage.getItem(storageKey) !== null, true);
});

function later(task) {
  queueMicrotask(task);
}

class FakeObjectStoreNames {
  constructor(stores) {
    this.stores = stores;
  }

  contains(name) {
    return this.stores.has(name);
  }
}

class FakeTransaction {
  constructor(stores, storeName) {
    this.stores = stores;
    this.storeName = storeName;
    this.aborted = false;
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
  }

  abort() {
    this.aborted = true;
    later(() => this.onabort?.());
  }

  objectStore(name) {
    if (name !== this.storeName || !this.stores.has(name)) {
      throw new Error(`Unknown fake IndexedDB object store ${name}`);
    }
    const values = this.stores.get(name);
    const complete = () => later(() => this.oncomplete?.());
    return {
      get: (key) => {
        const request = { result: undefined, onsuccess: null, onerror: null };
        later(() => {
          if (this.aborted) return;
          request.result = values.has(key)
            ? structuredClone(values.get(key))
            : undefined;
          request.onsuccess?.();
          complete();
        });
        return request;
      },
      put: (value) => {
        const request = { result: undefined, onsuccess: null, onerror: null };
        later(() => {
          if (this.aborted) return;
          const cloned = structuredClone(value);
          values.set(cloned.storageKey, cloned);
          request.result = cloned.storageKey;
          request.onsuccess?.();
          complete();
        });
        return request;
      },
      delete: (key) => {
        const request = { result: undefined, onsuccess: null, onerror: null };
        later(() => {
          if (this.aborted) return;
          values.delete(key);
          request.onsuccess?.();
          complete();
        });
        return request;
      },
    };
  }
}

class FakeDatabaseConnection {
  constructor(database) {
    this.database = database;
    this.objectStoreNames = new FakeObjectStoreNames(database.stores);
  }

  createObjectStore(name) {
    if (this.database.stores.has(name)) throw new Error("Object store exists");
    this.database.stores.set(name, new Map());
    return {};
  }

  transaction(name) {
    return new FakeTransaction(this.database.stores, name);
  }

  close() {}
}

export class MemoryIndexedDbFactory {
  constructor() {
    this.databases = new Map();
  }

  open(name, version) {
    const request = {
      result: undefined,
      transaction: null,
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      onblocked: null,
    };
    later(() => {
      let database = this.databases.get(name);
      const needsUpgrade = !database || database.version < version;
      if (!database) database = { version, stores: new Map() };
      const connection = new FakeDatabaseConnection(database);
      request.result = connection;
      if (needsUpgrade) {
        const upgrade = new FakeTransaction(database.stores, "media-create");
        request.transaction = upgrade;
        request.onupgradeneeded?.();
        if (upgrade.aborted) return;
        database.version = version;
        this.databases.set(name, database);
      }
      later(() => request.onsuccess?.());
    });
    return request;
  }

  peek(databaseName, storeName, key) {
    const value = this.databases.get(databaseName)?.stores.get(storeName)?.get(key);
    return value === undefined ? null : structuredClone(value);
  }
}

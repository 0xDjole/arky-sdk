export class MemoryStorage {
	constructor(options = {}) {
		this.options = options;
		this.values = new Map();
	}

	getItem(key) {
		if (this.options.readError) throw this.options.readError;
		return this.values.get(key) ?? null;
	}

	get length() {
		return this.values.size;
	}

	key(index) {
		return [...this.values.keys()][index] ?? null;
	}

	setItem(key, value) {
		if (this.options.writeError) throw this.options.writeError;
		if (!this.options.discardWrites) this.values.set(key, String(value));
	}

	removeItem(key) {
		if (this.options.removeError) throw this.options.removeError;
		if (!this.options.discardRemoves) this.values.delete(key);
	}

	seed(key, value) {
		this.values.set(key, value);
	}
}

export class ExclusiveLockManager {
	constructor() {
		this.held = new Set();
	}

	async request(name, options, callback) {
		if (this.held.has(name)) {
			if (options.ifAvailable) return callback(null);
			throw new Error(`Test lock ${name} unexpectedly queued`);
		}
		this.held.add(name);
		try {
			return await callback({ name, mode: options.mode });
		} finally {
			this.held.delete(name);
		}
	}
}

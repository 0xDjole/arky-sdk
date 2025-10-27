// SDK Configuration Types and Global State

export interface ArkyConfig {
    apiUrl: string;
    businessId: string;
    storageUrl?: string;
    auth?: {
        type: 'guest' | 'api-token';
        apiToken?: string;
    };
}

// Global configuration (set by initArky or ArkyClient)
let globalConfig: ArkyConfig | null = null;

export function setGlobalConfig(config: ArkyConfig): void {
    globalConfig = config;
    // Update module-level exports
    API_URL = config.apiUrl;
    BUSINESS_ID = config.businessId;
    STORAGE_URL = config.storageUrl || '';
}

export function getGlobalConfig(): ArkyConfig {
    if (!globalConfig) {
        throw new Error(
            'Arky SDK not initialized. Call initArky() or create an ArkyClient instance.'
        );
    }
    return globalConfig;
}

// Module-level exports (mutable, updated by setGlobalConfig)
export let API_URL = '';
export let BUSINESS_ID = '';
export let STORAGE_URL = '';

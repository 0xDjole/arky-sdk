// SDK Configuration Types

export interface ArkyConfig {
    apiUrl: string;
    businessId: string;
    storageUrl?: string;
    auth?: {
        type: 'guest' | 'api-token';
        apiToken?: string;
    };
}

// Simple global config storage (no module-level exports)
let globalConfig: ArkyConfig | null = null;

export function setGlobalConfig(config: ArkyConfig): void {
    globalConfig = config;
}

export function getGlobalConfig(): ArkyConfig {
    if (!globalConfig) {
        throw new Error(
            'Arky SDK not initialized. Call initArky() first.'
        );
    }
    return globalConfig;
}

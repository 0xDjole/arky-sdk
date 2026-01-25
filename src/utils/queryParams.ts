
export interface QueryParams {
    [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

export function buildQueryString(params: QueryParams): string {
    const queryParts: string[] = [];
    
    Object.entries(params).forEach(([key, value]) => {
        
        if (value === null || value === undefined) {
            return;
        }
        
        if (Array.isArray(value)) {
            const jsonString = JSON.stringify(value);
            queryParts.push(`${key}=${encodeURIComponent(jsonString)}`);
        }
        
        else if (typeof value === 'string') {
            queryParts.push(`${key}=${encodeURIComponent(value)}`);
        }
        
        else if (typeof value === 'number' || typeof value === 'boolean') {
            queryParts.push(`${key}=${value}`);
        }
        
        else if (typeof value === 'object') {
            const jsonString = JSON.stringify(value);
            queryParts.push(`${key}=${encodeURIComponent(jsonString)}`);
        }
    });
    
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
}

export function appendQueryString(url: string, params: QueryParams): string {
    const queryString = buildQueryString(params);
    return queryString ? `${url}${queryString}` : url;
}
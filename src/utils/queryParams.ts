/**
 * Query parameter builder utility that maintains exact backward compatibility
 * with existing API parameter encoding patterns
 */

export interface QueryParams {
    [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

/**
 * Builds a query string from parameters following the exact encoding patterns
 * used by the existing API implementation:
 * - Arrays: JSON.stringify then encodeURIComponent
 * - Strings: encodeURIComponent
 * - Numbers: No encoding
 * - Null/undefined: Skip
 */
export function buildQueryString(params: QueryParams): string {
    const queryParts: string[] = [];
    
    Object.entries(params).forEach(([key, value]) => {
        // Skip null and undefined values
        if (value === null || value === undefined) {
            return;
        }
        
        // Handle arrays: JSON.stringify then encode
        if (Array.isArray(value)) {
            const jsonString = JSON.stringify(value);
            queryParts.push(`${key}=${encodeURIComponent(jsonString)}`);
        }
        // Handle strings: encode
        else if (typeof value === 'string') {
            queryParts.push(`${key}=${encodeURIComponent(value)}`);
        }
        // Handle numbers and booleans: no encoding
        else if (typeof value === 'number' || typeof value === 'boolean') {
            queryParts.push(`${key}=${value}`);
        }
        // Handle objects (in case needed in future): JSON.stringify then encode
        else if (typeof value === 'object') {
            const jsonString = JSON.stringify(value);
            queryParts.push(`${key}=${encodeURIComponent(jsonString)}`);
        }
    });
    
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
}

/**
 * Appends query string to a URL
 */
export function appendQueryString(url: string, params: QueryParams): string {
    const queryString = buildQueryString(params);
    return queryString ? `${url}${queryString}` : url;
}
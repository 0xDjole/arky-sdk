// Toast notifications should be handled by UI layer

import { appendQueryString } from '../utils/queryParams';
import type { QueryParams } from '../utils/queryParams';

interface HttpOptions {
    successMessage?: string;
    errorMessage?: string;
    schema?: any;
    params?: QueryParams;
}

export interface HttpResponse<T = any> {
    value: T;
    success: boolean;
    error?: string;
}

async function get<T = any>(url: string, options?: HttpOptions): Promise<HttpResponse<T>> {
    try {
        // Append query parameters if provided
        const finalUrl = options?.params ? appendQueryString(url, options.params) : url;
        const response = await fetch(finalUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Success message should be handled by UI layer
        // if (options?.successMessage) {
        //     showToast(options.successMessage, 'success');
        // }
        
        return {
            value: data,
            success: true
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Error message should be handled by UI layer
        // if (options?.errorMessage) {
        //     showToast(options.errorMessage, 'error');
        // }
        
        return {
            value: null as any,
            success: false,
            error: errorMsg
        };
    }
}

async function post<T = any>(url: string, data: any, options?: HttpOptions): Promise<HttpResponse<T>> {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Success message should be handled by UI layer
        // if (options?.successMessage) {
        //     showToast(options.successMessage, 'success');
        // }
        
        return {
            value: responseData,
            success: true
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Error message should be handled by UI layer
        // if (options?.errorMessage) {
        //     showToast(options.errorMessage, 'error');
        // }
        
        return {
            value: null as any,
            success: false,
            error: errorMsg
        };
    }
}

const httpClient = {
    get,
    post
};

export default httpClient;
import { API_URL, BUSINESS_ID } from '../config';
import httpClient from '../services/http';
import { ApiResponse } from '../types';

const getCollection = async (id: string) => {
    const url = `${API_URL}/v1/businesses/${BUSINESS_ID}/collections/${id}`;
    const { value } = await httpClient.get(url);
    return value;
};

const getCollections = async ({ name = null, ids = null }: { name?: string | null; ids?: string[] | null }) => {
    const url = `${API_URL}/v1/businesses/${BUSINESS_ID}/collections`;
    
    const response = await httpClient.get(url, {
        params: { name, ids }
    });
    return response.value;
};

const getCollectionEntries = async ({ 
    collectionId, 
    limit, 
    cursor, 
    ids = null 
}: { 
    collectionId: string; 
    limit?: number; 
    cursor?: string; 
    ids?: string[] | null;
}) => {
    const url = `${API_URL}/v1/businesses/${BUSINESS_ID}/collections/${collectionId}/entries`;
    
    const response = await httpClient.get(url, {
        params: { limit, cursor, ids }
    });
    return response.value;
};

const createCollectionEntry = async (collectionEntryData: any) => {
    const url = `${API_URL}/v1/businesses/${BUSINESS_ID}/collections/${collectionEntryData.collectionId}/entries`;

    const result = await httpClient.post(url, collectionEntryData, {
        successMessage: "Created successfully",
        errorMessage: "Failed to create collection",
    });

    return result;
};

const getCollectionEntry = async ({ collectionId, id }: { collectionId: string; id: string }) => {
    const url = `${API_URL}/v1/businesses/${BUSINESS_ID}/collections/${collectionId}/entries/${id}`;

    const response = await httpClient.get(url);

    return response;
};

export const cmsApi = {
    getCollection,
    getCollections,
    getCollectionEntries,
    getCollectionEntry,
    createCollectionEntry,
};
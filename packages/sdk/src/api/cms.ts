import { getGlobalConfig } from '../config';
import httpClient from '../services/http';
import { ApiResponse } from '../types';

const getCollection = async (id: string) => {
    const config = getGlobalConfig();
    const url = `${config.apiUrl}/v1/businesses/${config.businessId}/collections/${id}`;
    const { value } = await httpClient.get(url);
    return value;
};

const getCollections = async ({ name = null, ids = null }: { name?: string | null; ids?: string[] | null }) => {
    const config = getGlobalConfig();
    const url = `${config.apiUrl}/v1/businesses/${config.businessId}/collections`;

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
    const config = getGlobalConfig();
    const url = `${config.apiUrl}/v1/businesses/${config.businessId}/collections/${collectionId}/entries`;

    const response = await httpClient.get(url, {
        params: { limit, cursor, ids }
    });
    return response.value;
};

const createCollectionEntry = async (collectionEntryData: any) => {
    const config = getGlobalConfig();
    const url = `${config.apiUrl}/v1/businesses/${config.businessId}/collections/${collectionEntryData.collectionId}/entries`;

    const result = await httpClient.post(url, collectionEntryData, {
        successMessage: "Created successfully",
        errorMessage: "Failed to create collection",
    });

    return result;
};

const getCollectionEntry = async ({ collectionId, id }: { collectionId: string; id: string }) => {
    const config = getGlobalConfig();
    const url = `${config.apiUrl}/v1/businesses/${config.businessId}/collections/${collectionId}/entries/${id}`;

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
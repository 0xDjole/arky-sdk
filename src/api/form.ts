import type { ApiConfig } from "../index";
import type { Form, FormEntry, Block, StatusEvent } from "../types";

export interface GetFormsParams {
  key?: string;
  ids?: string[];
  statuses?: string[];
  limit?: number;
  cursor?: string;
}

export interface GetFormParams {
  id: string;
}

export interface CreateFormParams {
  key: string;
  blocks?: Block[];
  isPubliclyReadable?: boolean;
  isPubliclyWritable?: boolean;
  isSubmissionEnabled?: boolean;
  isCaptchaRequired?: boolean;
  notificationTemplateKey?: string;
  notificationEmails?: string[];
}

export interface UpdateFormParams {
  id: string;
  key: string;
  blocks?: Block[];
  isPubliclyReadable: boolean;
  isPubliclyWritable: boolean;
  isSubmissionEnabled: boolean;
  isCaptchaRequired: boolean;
  notificationTemplateKey?: string;
  notificationEmails: string[];
  statuses: StatusEvent[];
}

export interface DeleteFormParams {
  id: string;
}

export interface GetEntriesParams {
  formId: string;
  ids?: string[];
  statuses?: string[];
  limit?: number;
  cursor?: string;
}

export interface CreateEntryParams {
  formId: string;
  blocks: Block[];
}

export interface GetEntryParams {
  formId: string;
  entryId: string;
}

export interface DeleteEntryParams {
  formId: string;
  entryId: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
}

export const createFormApi = (apiConfig: ApiConfig) => {
  return {
    // Form CRUD
    async getForms(params?: GetFormsParams, options?: RequestOptions): Promise<{ items: Form[]; cursor?: string }> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/forms`,
        {
          ...options,
          params,
        }
      );
    },

    async getForm(params: GetFormParams, options?: RequestOptions): Promise<Form> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/forms/${params.id}`,
        options
      );
    },

    async createForm(params: CreateFormParams, options?: RequestOptions): Promise<Form> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/forms`,
        params,
        options
      );
    },

    async updateForm(params: UpdateFormParams, options?: RequestOptions): Promise<Form> {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/forms/${params.id}`,
        params,
        options
      );
    },

    async deleteForm(params: DeleteFormParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/forms/${params.id}`,
        options
      );
    },

    // Form Entry CRUD
    async getEntries(params: GetEntriesParams, options?: RequestOptions): Promise<{ items: FormEntry[]; cursor?: string }> {
      const { formId, ...queryParams } = params;
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/forms/${formId}/entries`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async createEntry(params: CreateEntryParams, options?: RequestOptions): Promise<FormEntry> {
      const { formId, ...body } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/forms/${formId}/entries`,
        body,
        options
      );
    },

    async getEntry(params: GetEntryParams, options?: RequestOptions): Promise<FormEntry> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/forms/${params.formId}/entries/${params.entryId}`,
        options
      );
    },

    async deleteEntry(params: DeleteEntryParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/forms/${params.formId}/entries/${params.entryId}`,
        options
      );
    },
  };
};

import type { StoreBrandingPresentation } from "./storeBranding";

export interface StoreCustomerWorkspaceClient {
  storefront_client_id: string;
  publishable_key: string;
}

export interface StoreCustomerWorkspacePresentation extends StoreCustomerWorkspaceClient {
  branding: StoreBrandingPresentation;
  default_language: string | null;
  supported_languages: string[];
}

export interface StoreCustomerWorkspace {
  revision: string;
  client: StoreCustomerWorkspaceClient | null;
}

export interface UpdateStoreCustomerWorkspaceParams {
  id?: string;
  expected_revision: string | null;
  customer_workspace: StoreCustomerWorkspace;
}

import type { StoreBrandingPresentation } from "./storeBranding";

export interface StoreCustomerWorkspaceBinding {
  storefront_client_id: string;
  publishable_key: string;
}

export interface StoreCustomerWorkspacePresentation extends StoreCustomerWorkspaceBinding {
  branding: StoreBrandingPresentation;
  default_language: string | null;
  supported_languages: string[];
}

export interface StoreCustomerWorkspace {
  revision: string;
  binding: StoreCustomerWorkspaceBinding | null;
}

export interface UpdateStoreCustomerWorkspaceParams {
  id?: string;
  expected_revision: string | null;
  customer_workspace: StoreCustomerWorkspace;
}

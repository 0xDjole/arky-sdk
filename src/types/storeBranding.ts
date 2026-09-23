import type { Media } from "./index";

export interface StoreBranding {
  logo_media_id: string | null;
  icon_media_id: string | null;
  accent_color: string | null;
}

export interface StoreBrandingPresentation {
  id: string;
  name: string;
  logo: Media | null;
  icon: Media | null;
  accent_color: string | null;
}

export interface UpdateStoreBrandingParams {
  id?: string;
  branding: StoreBranding;
}

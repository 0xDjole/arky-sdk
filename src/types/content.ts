import type { EpochMilliseconds } from "./time";
import type { Block, BlockQuery, BlockSchema } from "./block";
import type { Coordinates, LocalizedText, SelectOption, SortDirection } from "./common";

export type CollectionStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" }
  | { type: "deleting" };

export type CollectionEditableStatus = Exclude<CollectionStatus, { type: "deleting" }>;

export interface Collection {
  id: string;
  store_id: string;
  key: string;
  schema: BlockSchema[];
  blocks: Block[];
  status: CollectionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type EntryStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" }
  | { type: "deleting" };

export type EntryEditableStatus = Exclude<EntryStatus, { type: "deleting" }>;

export interface Entry {
  id: string;
  store_id: string;
  collection_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  status: EntryStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CategoryStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" }
  | { type: "deleting" };

export type CategoryEditableStatus = Exclude<CategoryStatus, { type: "deleting" }>;

export type CategorySchema =
  | { type: "select_one"; id: string; key: string; label: LocalizedText; options: SelectOption[] }
  | { type: "select_many"; id: string; key: string; label: LocalizedText; options: SelectOption[] }
  | { type: "number"; id: string; key: string; label: LocalizedText; min: number | null; max: number | null }
  | { type: "boolean"; id: string; key: string; label: LocalizedText }
  | { type: "geo_location"; id: string; key: string; label: LocalizedText };

export type CategorySchemaType = CategorySchema["type"];

export type CategoryField =
  | { type: "select_one"; field_id: string; key: string; option_key: string }
  | { type: "select_many"; field_id: string; key: string; option_keys: string[] }
  | { type: "number"; field_id: string; key: string; value: number }
  | { type: "boolean"; field_id: string; key: string; value: boolean }
  | { type: "geo_location"; field_id: string; key: string; value: Coordinates };

export interface CategoryEntry {
  category_id: string;
  fields: CategoryField[];
}

export type CategoryNumberOperation =
  | "less_than"
  | "less_than_or_equal"
  | "equals"
  | "greater_than_or_equal"
  | "greater_than";

export type CategoryFieldQuery =
  | { type: "select"; key: string; option_keys: string[] }
  | { type: "number"; key: string; operation: CategoryNumberOperation; value: number }
  | { type: "boolean"; key: string; value: boolean }
  | { type: "geo_location"; key: string; center: Coordinates; radius_meters: number };

export interface CategoryQuery {
  category_id: string;
  query: CategoryFieldQuery[];
}

export interface Category {
  id: string;
  store_id: string;
  key: string;
  parent_id: string | null;
  slugs: Record<string, string>;
  blocks: Block[];
  schema: CategorySchema[];
  status: CategoryStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ImageFormat = "jpeg" | "png" | "webp" | "gif";

export type VideoFormat = "mp4" | "webm" | "quicktime";

export interface MediaFile {
  size_bytes: number;
  sha256: string;
  url: string;
}

export interface MediaImage {
  size_bytes: number;
  sha256: string;
  width_px: number;
  height_px: number;
  url: string;
}

export type MediaContent =
  | {
      type: "image";
      format: ImageFormat;
      original: MediaImage;
      thumbnail: MediaImage;
      small: MediaImage;
      medium: MediaImage;
      large: MediaImage;
    }
  | { type: "video"; format: VideoFormat; original: MediaFile }
  | { type: "pdf"; original: MediaFile };

export type MediaContentType = MediaContent["type"];

export type MediaImageSize = "original" | "thumbnail" | "small" | "medium" | "large";

export type MediaStatus = { type: "active" } | { type: "deleting" };

export interface Media {
  id: string;
  store_id: string;
  file_name: string;
  alt: LocalizedText | null;
  generation_id: string;
  content: MediaContent;
  status: MediaStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindCollectionsParams {
  store_id: string;
  ids?: string[];
  key?: string;
  query?: string;
  status?: CollectionStatus["type"];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export type GetCollectionParams = { store_id: string } & ({ id: string } | { key: string });

export type StorefrontGetCollectionParams = { id: string } | { key: string };

export interface CreateCollectionParams {
  store_id: string;
  id: string;
  key: string;
  schema: BlockSchema[];
  blocks: Block[];
  status?: CollectionEditableStatus;
}

export interface UpdateCollectionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  schema?: BlockSchema[];
  blocks?: Block[];
  status?: CollectionEditableStatus;
}

export interface DeleteCollectionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindEntriesParams {
  store_id: string;
  collection_id: string;
  key?: string;
  status?: EntryStatus["type"];
  query?: string;
  filters?: BlockQuery[];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface FindEntryBySlugParams {
  store_id: string;
  collection_id: string;
  slug: string;
  language: string;
}

export interface FindEntriesByIdsParams {
  store_id: string;
  ids: string[];
}

export type StorefrontFindEntriesParams = Omit<FindEntriesParams, "store_id" | "status">;

export interface StorefrontFindEntryBySlugParams {
  collection_id: string;
  slug: string;
}

export interface GetEntryParams {
  store_id: string;
  id: string;
}

export interface CreateEntryParams {
  store_id: string;
  id: string;
  collection_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  status?: EntryEditableStatus;
}

export interface UpdateEntryParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  status?: EntryEditableStatus;
}

export interface DeleteEntryParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCategoriesParams {
  store_id: string;
  ids?: string[];
  parent_id?: string;
  key?: string;
  query?: string;
  status?: CategoryStatus["type"];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetCategoryParams {
  store_id: string;
  id: string;
}

export type StorefrontGetCategoryParams = { id: string } | { slug: string };

export interface StorefrontGetCategoryByKeyParams {
  key: string;
}

export interface FindCategoryChildrenParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateCategoryParams {
  store_id: string;
  id: string;
  key: string;
  parent_id: string | null;
  slugs: Record<string, string>;
  blocks: Block[];
  schema: CategorySchema[];
}

export interface UpdateCategoryParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  parent_id?: string | null;
  slugs?: Record<string, string>;
  blocks?: Block[];
  schema?: CategorySchema[];
  status?: CategoryEditableStatus;
}

export interface DeleteCategoryParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type CreateMediaParams =
  | {
      store_id: string;
      id: string;
      file: File;
      alt?: LocalizedText | null;
      source_url?: never;
    }
  | {
      store_id: string;
      id: string;
      source_url: string;
      alt?: LocalizedText | null;
      file?: never;
    };

export interface GetMediaParams {
  store_id: string;
  id: string;
}

export interface FindMediaParams {
  store_id: string;
  ids?: string[];
  query?: string;
  type?: MediaContentType;
  sort_field?: "file_name" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface UpdateMediaParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  alt: LocalizedText | null;
}

export interface ReplaceMediaContentParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  file: File;
}

export interface DeleteMediaParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

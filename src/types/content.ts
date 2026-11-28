import type { EpochMilliseconds } from "./time";
import type { Block, BlockQuery, BlockSchema } from "./block";
import type { Coordinates, LocalizedText, SelectOption, SortDirection } from "./common";

export type CollectionStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" }
  | { type: "deleting" };

export type CollectionEditableStatus = Exclude<CollectionStatus, { type: "deleting" }>;

export type CollectionType = "public" | "private" | "user";

export type PrivateCollectionType = "private" | "user";

export interface Collection {
  id: string;
  tenant_id: string;
  key: string;
  type: CollectionType;
  schema: BlockSchema[];
  blocks: Block[];
  status: CollectionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PublicCollection extends Collection {
  type: "public";
}

export interface StorefrontCollection {
  id: string;
  tenant_id: string;
  key: string;
  type: "public";
  schema: BlockSchema[];
  blocks: Block[];
  status: CollectionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PrivateCollection extends Collection {
  type: PrivateCollectionType;
}

export interface CollectionCleanupReference {
  table: string;
  id: string;
  path: string;
}

export type CollectionCleanup =
  | { type: "running" }
  | { type: "stopped_at_entry"; entry_id: string; blocked_by: CollectionCleanupReference[] }
  | { type: "stopped_at_collection"; blocked_by: CollectionCleanupReference[] };

export type EntryStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "scheduled"; publish_at: EpochMilliseconds }
  | { type: "archived" }
  | { type: "deleting" };

export type EntryEditableStatus = Exclude<EntryStatus, { type: "deleting" }>;

export type PublicEntryType = { type: "public"; key: string; slugs: Record<string, string> };

export type PrivateEntryType = { type: "private" };

export type UserEntryType = { type: "user"; user_id: string };

export type EntryType = PublicEntryType | PrivateEntryType | UserEntryType;

export type PrivateEntryStatus = Exclude<EntryStatus, { type: "scheduled" }>;

export type PrivateEntryEditableStatus = Exclude<PrivateEntryStatus, { type: "deleting" }>;

export interface Entry {
  id: string;
  tenant_id: string;
  collection_id: string;
  type: EntryType;
  blocks: Block[];
  status: EntryStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  validation_errors: { field: string; error: string }[];
}

export interface PublicEntry extends Entry {
  type: PublicEntryType;
}

export interface PrivateEntry extends Entry {
  type: PrivateEntryType | UserEntryType;
  status: PrivateEntryStatus;
}

export interface StorefrontEntry {
  id: string;
  tenant_id: string;
  collection_id: string;
  type: PublicEntryType;
  blocks: Block[];
  status: EntryStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  validation_errors: { field: string; error: string }[];
}

export interface StorefrontUserEntry {
  id: string;
  tenant_id: string;
  collection_id: string;
  type: UserEntryType;
  blocks: Block[];
  status: PrivateEntryStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  validation_errors: { field: string; error: string }[];
}

export interface PrivateFileLink {
  url: string;
  expires_at: EpochMilliseconds;
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
  | { type: "select_one"; field_id: string; option_key: string }
  | { type: "select_many"; field_id: string; option_keys: string[] }
  | { type: "number"; field_id: string; value: number }
  | { type: "boolean"; field_id: string; value: boolean }
  | { type: "geo_location"; field_id: string; value: Coordinates };

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
  tenant_id: string;
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

export type AudioFormat = "mp3" | "wav";

export interface MediaFile {
  size_bytes: number;
  sha256: string;
  url: string | null;
}

export interface MediaImage {
  size_bytes: number;
  sha256: string;
  width_px: number;
  height_px: number;
  url: string | null;
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
  | { type: "audio"; format: AudioFormat; original: MediaFile }
  | { type: "pdf"; original: MediaFile };

export type MediaContentType = MediaContent["type"];

export type MediaImageSize = "original" | "thumbnail" | "small" | "medium" | "large";

export type MediaStatus = { type: "active" } | { type: "deleting" };

export type MediaVisibility = "public" | "private";

export interface Media {
  id: string;
  tenant_id: string;
  file_name: string;
  alt: LocalizedText | null;
  generation_id: string;
  visibility: MediaVisibility;
  content: MediaContent;
  status: MediaStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindCollectionsParams {
  tenant_id: string;
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

export interface GetCollectionParams {
  tenant_id: string;
  id: string;
}

export interface GetCollectionByKeyParams {
  tenant_id: string;
  key: string;
}

export interface FindCollectionEntryPageParams {
  tenant_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetCollectionCleanupParams {
  tenant_id: string;
  id: string;
}

export interface StorefrontGetCollectionParams {
  id: string;
}

export interface StorefrontGetCollectionByKeyParams {
  key: string;
}

export interface CreateCollectionParams {
  tenant_id: string;
  id: string;
  key: string;
  schema: BlockSchema[];
  blocks: Block[];
  status?: CollectionEditableStatus;
}

export interface UpdateCollectionParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  schema?: BlockSchema[];
  blocks?: Block[];
  status?: CollectionEditableStatus;
}

export interface DeleteCollectionParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCollectionEntriesParams {
  tenant_id: string;
  collection_id: string;
  key?: string;
  slug?: string;
  language?: string;
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

export interface FindEntriesByIdsParams {
  tenant_id: string;
  ids: string[];
  limit?: number;
  cursor?: never;
}

export type FindEntriesParams = FindCollectionEntriesParams | FindEntriesByIdsParams;

export interface StorefrontFindCollectionEntriesParams {
  collection_id: string;
  key?: string;
  slug?: string;
  query?: string;
  filters?: BlockQuery[];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontFindEntriesByIdsParams {
  ids: string[];
  limit?: number;
  cursor?: never;
}

export type StorefrontFindEntriesParams = StorefrontFindCollectionEntriesParams | StorefrontFindEntriesByIdsParams;

export interface StorefrontFindEntryBySlugParams {
  collection_id: string;
  slug: string;
}

export interface StorefrontGetEntryParams {
  id: string;
}

export interface StorefrontFindMediaParams {
  ids: string[];
}

export interface GetEntryParams {
  tenant_id: string;
  id: string;
}

export interface GetEntryByKeyParams {
  tenant_id: string;
  collection_id: string;
  key: string;
}

export interface CreateEntryParams {
  tenant_id: string;
  id: string;
  collection_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  status?: EntryEditableStatus;
}

export interface UpdateEntryParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  status?: EntryEditableStatus;
}

export interface DeleteEntryParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindPrivateCollectionsParams extends FindCollectionsParams {
  type?: PrivateCollectionType;
}

export interface CreatePrivateCollectionParams extends CreateCollectionParams {
  type: PrivateCollectionType;
}

export interface GetPrivateCollectionParams extends GetCollectionParams {}

export interface GetPrivateCollectionByKeyParams extends GetCollectionByKeyParams {}

export interface UpdatePrivateCollectionParams extends UpdateCollectionParams {}

export interface DeletePrivateCollectionParams extends DeleteCollectionParams {}

export interface FindPrivateEntriesParams {
  tenant_id: string;
  collection_id: string;
  user_id?: string;
  status?: PrivateEntryStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface GetPrivateEntryParams {
  tenant_id: string;
  collection_id: string;
  id: string;
}

export interface CreatePrivateEntryParams {
  tenant_id: string;
  collection_id: string;
  id: string;
  type: PrivateEntryType | UserEntryType;
  blocks: Block[];
  status?: PrivateEntryEditableStatus;
}

export interface UpdatePrivateEntryParams extends GetPrivateEntryParams {
  expected_updated_at: EpochMilliseconds;
  blocks?: Block[];
  status?: PrivateEntryEditableStatus;
}

export interface DeletePrivateEntryParams extends GetPrivateEntryParams {
  expected_updated_at: EpochMilliseconds;
}

export interface PrintPrivateEntryParams extends GetPrivateEntryParams {}

export interface PrivateEntryFileLinkParams extends GetPrivateEntryParams {
  media_id: string;
  variant: MediaImageSize;
}

export interface StorefrontFindUserEntriesParams {
  collection_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontGetUserEntryParams {
  id: string;
}

export interface StorefrontUserEntryFileLinkParams extends StorefrontGetUserEntryParams {
  media_id: string;
  variant: MediaImageSize;
}

export interface FindCategoriesParams {
  tenant_id: string;
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
  tenant_id: string;
  id: string;
}

export interface GetCategoryByKeyParams {
  tenant_id: string;
  key: string;
}

export type StorefrontGetCategoryParams = { id: string } | { slug: string };

export interface StorefrontGetCategoryByKeyParams {
  key: string;
}

export interface StorefrontFindCategoryChildrenParams {
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindCategoryChildrenParams {
  tenant_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateCategoryParams {
  tenant_id: string;
  id: string;
  key: string;
  parent_id: string | null;
  slugs: Record<string, string>;
  blocks: Block[];
  schema: CategorySchema[];
}

export interface UpdateCategoryParams {
  tenant_id: string;
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
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type CreateMediaParams =
  | {
      tenant_id: string;
      id: string;
      file: File;
      visibility: MediaVisibility;
      alt?: LocalizedText | null;
      source_url?: never;
    }
  | {
      tenant_id: string;
      id: string;
      source_url: string;
      visibility: MediaVisibility;
      alt?: LocalizedText | null;
      file?: never;
    };

export interface GetMediaParams {
  tenant_id: string;
  id: string;
}

export interface FindMediaParams {
  tenant_id: string;
  ids?: string[];
  query?: string;
  type?: MediaContentType;
  sort_field?: "file_name" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface UpdateMediaParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  alt: LocalizedText | null;
}

export interface ReplaceMediaContentParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  file: File;
}

export interface DeleteMediaParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

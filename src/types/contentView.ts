import type { Block } from "./block";
import type { Collection, Entry, Media, StorefrontFindCollectionEntriesParams } from "./content";

export interface ContentBlocks {
  readonly locale: string;
  readonly blocks: Block[];
  block(key: string): Block | null;
  text(key: string): string | null;
  media(key: string): Media | null;
  object(key: string): ContentBlocks | null;
  list(key: string): ContentBlocks[];
}

export interface LoadedContent<T extends Collection | Entry> extends ContentBlocks {
  readonly record: T;
  readonly media_by_id: Readonly<Record<string, Media>>;
}

export type LoadContentEntryParams =
  | { id: string }
  | { collection_id: string; key: string }
  | { collection_id: string; slug: string };

export type LoadContentCollectionParams = { id: string } | { key: string };

export type LoadContentParams =
  | { collection: LoadContentCollectionParams }
  | { entry: LoadContentEntryParams };

export type LoadContentEntriesParams = Omit<StorefrontFindCollectionEntriesParams, "cursor">;

export type LoadedContentFor<P extends LoadContentParams> = P extends { collection: LoadContentCollectionParams }
  ? LoadedContent<Collection>
  : LoadedContent<Entry>;

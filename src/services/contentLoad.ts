import type { RequestOptions } from "../types/httpClient";
import type { Block } from "../types/block";
import type { PaginatedResponse } from "../types/common";
import type {
  Collection,
  Entry,
  Media,
  StorefrontFindEntriesParams,
  StorefrontFindEntryBySlugParams,
} from "../types/content";
import type {
  ContentBlocks,
  LoadContentCollectionParams,
  LoadContentEntriesParams,
  LoadContentEntryParams,
  LoadContentParams,
  LoadedContent,
} from "../types/contentView";
import { ArkyError } from "../types/apiError";
import { collectBlockReferences, selectLocalizedText } from "../utils/blocks";
import { readAllPages } from "../utils/paginate";

export interface ContentReads {
  getCollection(params: LoadContentCollectionParams, options?: RequestOptions): Promise<Collection>;
  getEntry(params: { id: string }, options?: RequestOptions): Promise<Entry>;
  findEntries(params: StorefrontFindEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<Entry>>;
  findEntryBySlug(params: StorefrontFindEntryBySlugParams, options?: RequestOptions): Promise<Entry | null>;
  findMedia(params: { ids: string[] }, options?: RequestOptions): Promise<Media[]>;
}

const mediaIdsPerRead = 100;

function blockOfType<T extends Block["type"]>(block: Block | null, key: string, types: readonly T[]): Extract<Block, { type: T }> | null {
  if (!block) return null;
  if (!(types as readonly string[]).includes(block.type)) {
    throw new TypeError(`The content block '${key}' is ${block.type}, not ${types.join(" or ")}`);
  }
  return block as Extract<Block, { type: T }>;
}

function contentBlocks(blocks: Block[], locale: string, mediaById: Readonly<Record<string, Media>>): ContentBlocks {
  const find = (key: string): Block | null => blocks.find((block) => block.key === key) ?? null;
  return {
    locale,
    blocks,
    block: find,
    text(key) {
      const block = blockOfType(find(key), key, ["text", "markdown", "localized_text", "localized_markdown"] as const);
      if (!block || block.value === null) return null;
      if (block.type === "text" || block.type === "markdown") return block.value;
      return selectLocalizedText(block.value, locale);
    },
    media(key) {
      const block = blockOfType(find(key), key, ["media"] as const);
      if (!block || block.value === null) return null;
      return mediaById[block.value] ?? null;
    },
    object(key) {
      const block = blockOfType(find(key), key, ["object"] as const);
      return block ? contentBlocks(block.value, locale, mediaById) : null;
    },
    list(key) {
      const block = blockOfType(find(key), key, ["array"] as const);
      if (!block) return [];
      return block.value.map((item) => contentBlocks(item.type === "object" ? item.value : [item], locale, mediaById));
    },
  };
}

async function readMedia(
  reads: ContentReads,
  records: readonly { blocks: readonly Block[] }[],
  options?: RequestOptions,
): Promise<Record<string, Media>> {
  const ids = [...new Set(records.flatMap((record) => collectBlockReferences(record.blocks).media_ids))];
  const media: Record<string, Media> = {};
  for (let start = 0; start < ids.length; start += mediaIdsPerRead) {
    const asked = ids.slice(start, start + mediaIdsPerRead);
    const found = await reads.findMedia({ ids: asked }, options);
    if (!Array.isArray(found)) throw new ArkyError("answer_mismatch", "The media read did not answer a list");
    for (const item of found) {
      if (!asked.includes(item.id)) throw new ArkyError("answer_mismatch", "The media read answered a file it was not asked for");
      media[item.id] = item;
    }
  }
  return media;
}

function loaded<T extends Collection | Entry>(record: T, locale: string, mediaById: Readonly<Record<string, Media>>): LoadedContent<T> {
  return { ...contentBlocks(record.blocks, locale, mediaById), record, media_by_id: mediaById };
}

async function readEntry(reads: ContentReads, params: LoadContentEntryParams, options?: RequestOptions): Promise<Entry> {
  if ("id" in params) return reads.getEntry({ id: params.id }, options);
  if ("slug" in params) {
    const found = await reads.findEntryBySlug({ collection_id: params.collection_id, slug: params.slug }, options);
    if (!found) throw new ArkyError("not_found", `No entry has the slug '${params.slug}' in this collection`);
    return found;
  }
  const page = await reads.findEntries({ collection_id: params.collection_id, key: params.key, limit: 1 }, options);
  const found = page.items[0];
  if (!found || found.key !== params.key) throw new ArkyError("not_found", `No entry has the key '${params.key}' in this collection`);
  return found;
}

export async function loadContent(
  reads: ContentReads,
  params: LoadContentParams,
  locale: string,
  options?: RequestOptions,
): Promise<LoadedContent<Collection> | LoadedContent<Entry>> {
  if ("collection" in params) {
    const collection = await reads.getCollection(params.collection, options);
    return loaded(collection, locale, await readMedia(reads, [collection], options));
  }
  const entry = await readEntry(reads, params.entry, options);
  return loaded(entry, locale, await readMedia(reads, [entry], options));
}

export async function loadContentEntries(
  reads: ContentReads,
  params: LoadContentEntriesParams,
  locale: string,
  options?: RequestOptions,
): Promise<LoadedContent<Entry>[]> {
  const entries = await readAllPages((cursor) => reads.findEntries({ ...params, ...(cursor ? { cursor } : {}) }, options));
  const media = await readMedia(reads, entries, options);
  return entries.map((entry) => loaded(entry, locale, media));
}

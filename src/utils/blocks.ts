import type { Block } from "../types/block";
import type { LocalizedMarkdown, LocalizedText } from "../types/common";
import type { Media, MediaImageSize } from "../types/content";

type BlockContainer = { blocks?: readonly Block[] | null };

export function findBlock(entry: BlockContainer | null | undefined, key: string): Block | undefined {
  return entry?.blocks?.find((block) => block.key === key);
}

export function selectLocalizedText(
  value: Readonly<LocalizedText | LocalizedMarkdown> | null | undefined,
  locale: string,
  defaultLocale?: string | null,
): string | null {
  if (!value) return null;
  for (const selected of [locale, defaultLocale]) {
    if (selected && Object.prototype.hasOwnProperty.call(value, selected)) return value[selected];
  }
  return null;
}

export function blockContent(block: Block, locale: string, defaultLocale?: string | null): unknown {
  switch (block.type) {
    case "localized_text":
    case "localized_markdown":
      return selectLocalizedText(block.value, locale, defaultLocale);
    case "array":
      return block.value.map((item) => blockContent(item, locale, defaultLocale));
    case "object":
      return Object.fromEntries(block.value.map((field) => [field.key, blockContent(field, locale, defaultLocale)]));
    default:
      return block.value;
  }
}

export function getBlockValue<T = unknown>(entry: BlockContainer | null | undefined, key: string): T | null {
  return (findBlock(entry, key)?.value as T | undefined) ?? null;
}

export function getBlockContentValue(
  entry: BlockContainer | null | undefined,
  key: string,
  locale: string,
  defaultLocale?: string | null,
): unknown {
  const block = findBlock(entry, key);
  return block ? blockContent(block, locale, defaultLocale) : null;
}

export function getBlockTextValue(block: Block | null | undefined, locale: string, defaultLocale?: string | null): string {
  if (!block || block.value === null) return "";
  switch (block.type) {
    case "text":
    case "markdown":
      return block.value;
    case "localized_text":
    case "localized_markdown":
      return selectLocalizedText(block.value, locale, defaultLocale) ?? "";
    case "number":
    case "boolean":
    case "date":
    case "date_time":
      return String(block.value);
    default:
      return "";
  }
}

export function getBlockValues(entry: BlockContainer | null | undefined, key: string): Block[] {
  const block = findBlock(entry, key);
  return block?.type === "array" ? block.value : [];
}

export function getBlockObjectValues(
  entry: BlockContainer | null | undefined,
  key: string,
  locale: string,
  defaultLocale?: string | null,
): Record<string, unknown>[] {
  return getBlockValues(entry, key)
    .filter((item) => item.type === "object")
    .map((item) => blockContent(item, locale, defaultLocale) as Record<string, unknown>);
}

export function getBlockFromArray(
  entry: BlockContainer | null | undefined,
  key: string,
  locale: string,
  defaultLocale?: string | null,
): Record<string, unknown> {
  const block = findBlock(entry, key);
  if (!block) return {};
  if (block.type === "object") return blockContent(block, locale, defaultLocale) as Record<string, unknown>;
  return { [block.key]: blockContent(block, locale, defaultLocale) };
}

export function getBlockLabel(block: Pick<Block, "key"> | null | undefined): string {
  return block?.key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "";
}

export function formatBlockValue(block: Block | null | undefined, locale: string, defaultLocale?: string | null): string {
  if (!block || block.value === null) return "";
  if (block.type === "date_time") return new Date(block.value).toLocaleString(locale);
  if (block.type === "date") return new Date(`${block.value}T00:00:00Z`).toLocaleDateString(locale, { timeZone: "UTC" });
  if (block.type === "geo_location") return `${block.value.lat}, ${block.value.lon}`;
  if (block.type === "array" || block.type === "object") return "";
  return getBlockTextValue(block, locale, defaultLocale);
}

export function extractBlockValues(blocks: readonly Block[]): Record<string, unknown> {
  return Object.fromEntries(blocks.map((block) => [block.key, block.value]));
}

export interface BlockReferences {
  mediaIds: string[];
  entryIds: string[];
  formIds: string[];
  productIds: string[];
}

export function collectBlockReferences(blocks: readonly Block[]): BlockReferences {
  const mediaIds = new Set<string>();
  const entryIds = new Set<string>();
  const formIds = new Set<string>();
  const productIds = new Set<string>();

  function visit(block: Block): void {
    if (block.type === "media" && block.value) mediaIds.add(block.value);
    if (block.type === "entry" && block.value) entryIds.add(block.value);
    if (block.type === "form" && block.value) formIds.add(block.value);
    if (block.type === "product" && block.value) productIds.add(block.value);
    if (block.type === "array" || block.type === "object") block.value.forEach(visit);
  }

  blocks.forEach(visit);
  return {
    mediaIds: [...mediaIds],
    entryIds: [...entryIds],
    formIds: [...formIds],
    productIds: [...productIds],
  };
}

export function getImageUrl(media: Media | null | undefined, size: MediaImageSize = "original"): string | null {
  if (!media) return null;
  const content = media.content;
  if (content.type === "image") return content[size].url;
  return content.original.url;
}

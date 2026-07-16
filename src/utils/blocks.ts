import type { Block } from "../types";

type BlockContainer = { blocks?: readonly Block[] | null };
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBlock(value: unknown): value is Block {
  return isRecord(value) && typeof value.key === "string" && typeof value.type === "string";
}

function recordFromBlocks(values: readonly unknown[], locale: string): UnknownRecord {
  const result: UnknownRecord = {};
  for (const value of values) {
    if (!isBlock(value)) continue;
    result[value.key] = unwrapBlock(value, locale);
  }
  return result;
}

function localizedValue(value: unknown, locale: string): string {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "";
  const selected = value[locale] ?? value.en;
  return typeof selected === "string" ? selected : "";
}

function unwrapBlock(value: unknown, locale: string): unknown {
  if (!isBlock(value)) return value;
  if (value.type === "localized_text" || value.type === "markdown") {
    return localizedValue(value.value, locale);
  }
  if (value.type === "array") {
    if (!Array.isArray(value.value)) return [];
    return value.value.map((item) => {
      if (isBlock(item)) return unwrapBlock(item, locale);
      if (isRecord(item) && Array.isArray(item.value)) {
        return recordFromBlocks(item.value, locale);
      }
      if (!isRecord(item)) return item;
      return Object.fromEntries(
        Object.entries(item).map(([key, nested]) => [key, unwrapBlock(nested, locale)]),
      );
    });
  }
  if (value.type === "object") {
    if (Array.isArray(value.value)) return recordFromBlocks(value.value, locale);
    if (!isRecord(value.value)) return {};
    return Object.fromEntries(
      Object.entries(value.value).map(([key, nested]) => [key, unwrapBlock(nested, locale)]),
    );
  }
  return value.value;
}

function blockContentArray(values: readonly unknown[], locale: string): unknown {
  const blocks = values.filter(isBlock);
  if (blocks.length === 0) return [];
  if (blocks.every((block) => block.key === blocks[0].key)) {
    return blocks.map((block) => blockContentValue(block, locale));
  }
  return Object.fromEntries(
    blocks.map((block) => [block.key, blockContentValue(block, locale)]),
  );
}

function blockContentValue(block: Block, locale: string): unknown {
  if (block.type === "localized_text" || block.type === "markdown") {
    return localizedValue(block.value, locale);
  }
  if (block.type === "media") return block.value ?? null;
  if (block.type === "array") {
    return Array.isArray(block.value) ? blockContentArray(block.value, locale) : [];
  }
  if (block.type === "object") {
    if (Array.isArray(block.value)) return blockContentArray(block.value, locale);
    if (!isRecord(block.value)) return {};
    return Object.fromEntries(
      Object.entries(block.value).map(([key, value]) => [
        key,
        isBlock(value) ? blockContentValue(value, locale) : value,
      ]),
    );
  }
  return block.value;
}

export function findBlock(entry: BlockContainer | null | undefined, key: string): Block | undefined {
  return entry?.blocks?.find((block) => block.key === key);
}

export function getBlockLabel(block: Pick<Block, "key"> | null | undefined): string {
  return block?.key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "";
}

export function formatBlockValue(block: Block | null | undefined): string {
  if (block?.value === null || block?.value === undefined) return "";
  if (block.type === "boolean") return block.value ? "Yes" : "No";
  if (block.type === "number") {
    const properties = isRecord(block.properties) ? block.properties : {};
    if (properties.variant === "DATE" || properties.variant === "DATE_TIME") {
      return new Date(Number(block.value)).toLocaleDateString();
    }
  }
  if (block.type === "media" && isRecord(block.value)) {
    const label = block.value.name ?? block.value.title ?? block.value.id;
    return typeof label === "string" ? label : "";
  }
  return String(block.value);
}

export function prepareBlocksForSubmission(
  formData: Readonly<Record<string, unknown>>,
  blockTypes: Readonly<Record<string, string>> = {},
): Array<{ key: string; value: unknown }> {
  return Object.entries(formData)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      value: blockTypes[key] === "array" && !Array.isArray(value) ? [value] : value,
    }));
}

export function extractBlockValues(blocks: readonly Block[]): Record<string, unknown> {
  return Object.fromEntries(blocks.map((block) => [block.key, block.value ?? null]));
}

export function getBlockValue<T = unknown>(
  entry: BlockContainer | null | undefined,
  key: string,
): T | null {
  return (findBlock(entry, key)?.value as T | undefined) ?? null;
}

export function getBlockTextValue(block: Block | null | undefined, locale = "en"): string {
  if (!block || block.value === null || block.value === undefined) return "";
  if (block.type === "localized_text" || block.type === "markdown") {
    return localizedValue(block.value, locale);
  }
  return typeof block.value === "string" ? block.value : String(block.value);
}

export function getBlockContentValue(
  entry: BlockContainer | null | undefined,
  key: string,
  locale = "en",
): unknown {
  const block = findBlock(entry, key);
  return block ? blockContentValue(block, locale) : null;
}

export function getBlockValues<T = unknown>(
  entry: BlockContainer | null | undefined,
  key: string,
): T[] {
  const block = findBlock(entry, key);
  return block?.type === "array" && Array.isArray(block.value) ? (block.value as T[]) : [];
}

export function getBlockObjectValues(
  entry: BlockContainer | null | undefined,
  key: string,
  locale = "en",
): UnknownRecord[] {
  return getBlockValues(entry, key).map((value) => {
    if (isRecord(value) && Array.isArray(value.value)) {
      return recordFromBlocks(value.value, locale);
    }
    return isRecord(value)
      ? Object.fromEntries(
          Object.entries(value).map(([field, nested]) => [field, unwrapBlock(nested, locale)]),
        )
      : {};
  });
}

export function getBlockFromArray(
  entry: BlockContainer | null | undefined,
  key: string,
  locale = "en",
): UnknownRecord {
  const block = findBlock(entry, key);
  if (!block) return {};
  const value = unwrapBlock(block, locale);
  if (isRecord(value)) return value;
  if (Array.isArray(block.value)) return recordFromBlocks(block.value, locale);
  return { [block.key]: value };
}

function nestedUrl(value: UnknownRecord): string | null {
  const resolutions = isRecord(value.resolutions) ? value.resolutions : null;
  const original = resolutions && isRecord(resolutions.original) ? resolutions.original : null;
  if (typeof original?.url === "string") return original.url;
  return typeof value.url === "string" ? value.url : null;
}

export function getImageUrl(value: unknown, isBlock = true): string | null {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return null;
  if (value.type === "media" && isRecord(value.value)) return nestedUrl(value.value);
  if (isBlock && typeof value.url === "string") return value.url;
  return nestedUrl(value);
}

export function translateMap(labels: unknown, language: string): unknown {
  return isRecord(labels) ? labels[language] : undefined;
}

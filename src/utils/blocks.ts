
export interface Block {
  id: string;
  key: string;
  type: string;
  properties: any;
  value: any;
}

export interface Collection {
  id: string;
  blocks: Block[];
  entity: string;
}

export interface CollectionEntry {
  id: string;
  collection_id: string;
  blocks: Block[];
}

export function getBlockLabel(block: any, locale: string = "en"): string {
  if (!block) return "";
  const label = block.properties?.label;
  if (typeof label === "string") return label;
  if (label && typeof label === "object") return label[locale] ?? label["en"] ?? "";
  return block.key?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? "";
}

export function formatBlockValue(block: any): string {
  if (!block || block.value === null || block.value === undefined) return "";

  const value = block.value;

  switch (block.type) {
    case "boolean":
      return value ? "Yes" : "No";
    case "number":
      if (block.properties?.variant === "DATE" || block.properties?.variant === "DATE_TIME") {
        return new Date(value).toLocaleDateString();
      }
      return String(value);
    case "relationship_entry":
    case "relationship_media":
      if (value && typeof value === 'object') {
        return value.mimeType ? (value.name || value.id) : (value.title || value.name || value.id);
      }
      return String(value);
    default:
      return String(value);
  }
}

export function prepareBlocksForSubmission(formData: any, blockTypes?: Record<string, string>): any[] {
  return Object.keys(formData)
    .filter((key) => formData[key] !== null && formData[key] !== undefined)
    .map((key) => ({
      key,
      value: blockTypes?.[key] === 'block' && !Array.isArray(formData[key])
        ? [formData[key]]
        : formData[key],
    }));
}

export function extractBlockValues(blocks: any[]): Record<string, any> {
  const values: Record<string, any> = {};
  blocks.forEach((block) => {
    values[block.key] = block.value ?? null;
  });
  return values;
}

export const getBlockValue = (entry: any, blockKey: string) => {
  const block = entry?.blocks?.find((f: any) => f.key === blockKey);
  return block?.value ?? null;
};

export const getBlockTextValue = (block: any, locale: string = "en"): string => {
  if (!block || block.value === null || block.value === undefined) return "";

  // For localized_text and markdown, value is { en: "...", bs: "..." }
  if (block.type === "localized_text" || block.type === "markdown") {
    if (typeof block.value === "object" && block.value !== null) {
      return block.value[locale] ?? block.value["en"] ?? "";
    }
  }

  // For TEXT and other simple types, value is a string
  if (typeof block.value === "string") return block.value;

  return String(block.value ?? "");
};

export const getBlockValues = (entry: any, blockKey: string) => {
  const block = entry?.blocks?.find((f: any) => f.key === blockKey);
  if (!block) return [];

  // For block type, value is an array of child blocks
  if (block.type === "block" && Array.isArray(block.value)) {
    return block.value;
  }

  return [];
};

function unwrapBlock(block: any, locale: string) {
  if (!block?.type || block.value === undefined) return block;

  if (block.type === "block") {
    return block.value.map((obj: Record<string, any>) => {
      const parsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        parsed[k] = unwrapBlock(v, locale);
      }
      return parsed;
    });
  }

  if (block.type === "text_filter" || block.type === "number_filter") {
    return block.value;
  }

  if (block.type === "localized_text" || block.type === "markdown") {
    return block.value?.[locale];
  }

  return block.value;
}

export const getBlockObjectValues = (entry: any, blockKey: string, locale = "en") => {
  const block = entry?.blocks?.find((f: any) => f.key === blockKey);
  if (!block || block.type !== "block" || !Array.isArray(block.value)) return [];

  return block.value.map((obj: Record<string, any>) => {
    if (!obj?.value || !Array.isArray(obj.value)) return {};
    return obj.value.reduce((acc: any, current: any) => {
      acc[current.key] = unwrapBlock(current, locale);
      return acc;
    }, {});
  });
};

export const getBlockFromArray = (entry: any, blockKey: string, locale = "en") => {
  const block = entry?.blocks?.find((f: any) => f.key === blockKey);
  if (!block) return {};

  if (block.type === "block" && Array.isArray(block.value)) {
    return block.value.reduce((acc: any, current: any) => {
      acc[current.key] = unwrapBlock(current, locale);
      return acc;
    }, {});
  }

  return { [block.key]: unwrapBlock(block, locale) };
};

export const getImageUrl = (imageBlock: any, isBlock = true) => {
  if (!imageBlock) return null;

  if (imageBlock.type === "relationship_media") {
    const mediaValue = imageBlock.value;
    return mediaValue?.resolutions?.original?.url || mediaValue?.url || null;
  }

  if (isBlock) {
    if (typeof imageBlock === "string") return imageBlock;
    if (imageBlock.url) return imageBlock.url;
  }

  return imageBlock.resolutions?.original?.url || null;
};

export const translateMap = (labels: any, lang: string) => {
  return labels?.[lang];
};


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
  if (typeof block.properties?.label === "string") return block.properties.label;
  if (typeof block.properties?.label === "object") return block.properties.label[locale];
  return block.key?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
}

export function formatBlockValue(block: any): string {
  if (!block || block.value === null || block.value === undefined) return "";

  const value = block.value;

  switch (block.type) {
    case "BOOLEAN":
      return value ? "Yes" : "No";
    case "NUMBER":
      if (block.properties?.variant === "DATE" || block.properties?.variant === "DATE_TIME") {
        return new Date(value).toLocaleDateString();
      }
      return String(value);
    case "RELATIONSHIP_ENTRY":
    case "RELATIONSHIP_MEDIA":
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
      value: blockTypes?.[key] === 'BLOCK' && !Array.isArray(formData[key])
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

function unwrapBlock(block: any, locale: string) {
  if (!block?.type || block.value === undefined) return block;

  if (block.type === "BLOCK") {
    return block.value.map((obj: Record<string, any>) => {
      const parsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        parsed[k] = unwrapBlock(v, locale);
      }
      return parsed;
    });
  }

  if (block.type === "TEXT_FILTER" || block.type === "NUMBER_FILTER") {
    return block.value;
  }

  if (block.type === "LOCALIZED_TEXT" || block.type === "MARKDOWN") {
    return block.value?.[locale];
  }

  return block.value;
}

export const getBlockObjectValues = (entry: any, blockKey: string, locale = "en") => {
  const block = entry?.blocks?.find((f: any) => f.key === blockKey);
  if (!block || block.type !== "BLOCK" || !Array.isArray(block.value)) return [];

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

  if (block.type === "BLOCK" && Array.isArray(block.value)) {
    return block.value.reduce((acc: any, current: any) => {
      acc[current.key] = unwrapBlock(current, locale);
      return acc;
    }, {});
  }

  return { [block.key]: unwrapBlock(block, locale) };
};

export const getImageUrl = (imageBlock: any, isBlock = true) => {
  if (!imageBlock) return null;

  if (imageBlock.type === "RELATIONSHIP_MEDIA") {
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

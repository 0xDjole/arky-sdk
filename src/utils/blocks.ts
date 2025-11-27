// Block utilities (extracted from index.ts)

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
}

export interface CollectionEntry {
  id: string;
  collection_id: string;
  blocks: Block[];
}

export function getBlockLabel(block: any, locale: string = "en"): string {
  if (!block) return "";

  if (block.properties?.label) {
    if (typeof block.properties.label === "object") {
      return (
        block.properties.label[locale] ||
        block.properties.label.en ||
        Object.values(block.properties.label)[0] ||
        ""
      );
    }
    if (typeof block.properties.label === "string") {
      return block.properties.label;
    }
  }

  // Convert key to readable format
  return (
    block.key
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase()) || ""
  );
}

export function formatBlockValue(block: any): string {
  if (!block || block.value === null || block.value === undefined) {
    return "";
  }

  switch (block.type) {
    case "BOOLEAN":
      return block.value ? "Yes" : "No";
    case "NUMBER":
      // Handle date/datetime variants
      if (
        block.properties?.variant === "DATE" ||
        block.properties?.variant === "DATE_TIME"
      ) {
        try {
          return new Date(block.value).toLocaleDateString();
        } catch (e) {
          return String(block.value);
        }
      }
      return String(block.value);
    case "RELATIONSHIP":
      if (Array.isArray(block.value) && block.value.length > 0) {
        const firstValue = block.value[0];
        if (firstValue && firstValue.mimeType) {
          return firstValue.name || firstValue.id || "Media";
        }
        return firstValue.title || firstValue.name || firstValue.id || "Entry";
      }
      return String(block.value);
    default:
      return String(block.value);
  }
}

export function prepareBlocksForSubmission(formData: any): any[] {
  const preparedBlocks = [];

  Object.keys(formData).forEach((key) => {
    if (formData[key] !== null && formData[key] !== undefined) {
      preparedBlocks.push({
        key,
        value: [formData[key]],
      });
    }
  });

  return preparedBlocks;
}

export function extractBlockValues(blocks: any[]): Record<string, any> {
  const values: Record<string, any> = {};

  blocks.forEach((block) => {
    if (block.value && block.value.length > 0) {
      values[block.key] = block.value[0];
    } else {
      values[block.key] = null;
    }
  });

  return values;
}

// Extract localized text value from a block, handling multilingual content
export function getBlockTextValue(block: any, locale: string = "en"): string {
  if (!block || !block.value || block.value.length === 0) return "";

  const firstValue = block.value[0];

  // Handle multilingual object
  if (typeof firstValue === "object" && firstValue !== null) {
    // Try specified locale first, then 'en', then first available language
    if (firstValue[locale]) return firstValue[locale];
    if (firstValue.en) return firstValue.en;
    const values = Object.values(firstValue);
    return String(values[0] || "");
  }

  // Handle simple string
  return String(firstValue);
}

// Legacy functions for backward compatibility
export const getBlockValue = (entry: any, blockKey: string) => {
  if (!entry || !entry.blocks) return null;

  const block = entry.blocks.find((f: any) => f.key === blockKey);

  if (!block || !block.value || block.value.length === 0) return null;

  return block.value[0];
};

export const getBlockValues = (entry: any, blockKey: string) => {
  if (!entry || !entry.blocks) return null;

  const block = entry.blocks.find((f: any) => f.key === blockKey);

  if (!block || !block.value || block.value.length === 0) return null;

  return block.value;
};

function unwrapBlock(block: any, locale: string) {
  if (!block?.type || block.value === undefined) return block;

  // Nested objects / lists → recurse for every child
  if (block.type === "BLOCK") {
    return block.value.map((obj: Record<string, any>) => {
      const parsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        parsed[k] = unwrapBlock(v, locale);
      }
      return parsed;
    });
  }

  // Primitive leaves (text/number/boolean/media …)
  const isLocalized = block.type === "TEXT";
  const isList =
    block.properties?.ui === "list" ||
    (block.properties?.maxValues ?? 1) > 1 ||
    block.value.length > 1;

  if (isList) {
    return isLocalized
      ? block.value.map((v: Record<string, any>) => v[locale] || v["en"])
      : [...block.value];
  }

  return isLocalized
    ? block.value[0][locale] || block.value[0]["en"]
    : block.value[0];
}

export const getBlockObjectValues = (
  entry: any,
  blockKey: string,
  locale = "en"
) => {
  if (!entry) {
    return [];
  }

  const values = getBlockValues(entry, blockKey); // top‑level list

  const parsed = values.map((obj: Record<string, any>) => {
    const res = obj.value.reduce((acc: any, current: any) => {
      acc[current.key] = unwrapBlock(current, locale);

      return acc;
    }, {});

    return res;
  });

  return parsed;
};

export const getBlockFromArray = (
  entry: any,
  blockKey: string,
  locale = "en"
) => {
  if (!entry) {
    return [];
  }

  const values = getBlockValues(entry, blockKey); // top‑level list

  return values.reduce((acc: any, current: any) => {
    acc[current.key] = unwrapBlock(current, locale);
    return acc;
  });
};

export const getImageUrl = (imageBlock: any, isBlock = true) => {
  if (!imageBlock) return null;

  if (
    imageBlock.type === "RELATIONSHIP_MEDIA" &&
    Array.isArray(imageBlock.value)
  ) {
    const mediaValue = imageBlock.value[0];
    if (mediaValue && mediaValue.mimeType) {
      // Handle media with resolutions structure
      if (
        mediaValue.resolutions &&
        mediaValue.resolutions.original &&
        mediaValue.resolutions.original.url
      ) {
        return mediaValue.resolutions.original.url;
      }

      // Handle direct URL on media
      if (mediaValue.url) {
        return mediaValue.url;
      }
    }
    return null;
  }

  if (isBlock) {
    if (typeof imageBlock === "string") {
      return imageBlock;
    }

    if (imageBlock.url) {
      return imageBlock.url;
    }
  }

  if (
    imageBlock.resolutions &&
    imageBlock.resolutions.original &&
    imageBlock.resolutions.original.url
  ) {
    return imageBlock.resolutions.original.url;
  }

  return null;
};

export const translateMap = (
  labels: any,
  lang: string,
  fallback = "unknown"
) => {
  let parsedLang = "en";

  if (lang === "sr") {
    parsedLang = "bih";
  }

  if (!labels) {
    return fallback;
  }

  const label = labels[parsedLang];
  if (!label) {
    return fallback;
  }

  return label;
};

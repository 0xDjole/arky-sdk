
const KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function isValidKey(key: string): boolean {
  if (!key || key.length === 0) return false;
  return KEY_PATTERN.test(key);
}

export function validateKey(key: string): { valid: boolean; error?: string } {
  if (!key || key.length === 0) {
    return { valid: false, error: "Key is required" };
  }

  if (key.length > 255) {
    return { valid: false, error: "Key must be 255 characters or less" };
  }

  if (!KEY_PATTERN.test(key)) {
    return {
      valid: false,
      error:
        "Key can only contain letters, numbers, underscores (_) and hyphens (-)",
    };
  }

  return { valid: true };
}

export function toKey(input: string): string {
  if (!input) return "";

  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") 
    .replace(/[^a-z0-9_-]/g, "") 
    .replace(/^[-_]+|[-_]+$/g, "") 
    .replace(/[-_]{2,}/g, "_"); 
}

export function nameToKey(name: string): string {
  return toKey(name);
}

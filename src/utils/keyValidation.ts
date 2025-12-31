/**
 * Key Validation Utilities
 *
 * Keys must contain only:
 * - Letters (a-z, A-Z)
 * - Numbers (0-9)
 * - Underscore (_)
 * - Hyphen (-)
 */

const KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validates if a key is valid
 * @param key - The key to validate
 * @returns true if key is valid, false otherwise
 */
export function isValidKey(key: string): boolean {
  if (!key || key.length === 0) return false;
  return KEY_PATTERN.test(key);
}

/**
 * Validates a key and returns validation result with error message
 * @param key - The key to validate
 * @returns Validation result object
 */
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

/**
 * Converts a string to a valid key format
 * - Converts to lowercase
 * - Replaces spaces with underscores
 * - Removes invalid characters
 * - Trims leading/trailing underscores/hyphens
 *
 * @param input - The string to convert
 * @returns A valid key string
 */
export function toKey(input: string): string {
  if (!input) return "";

  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_-]/g, "") // Remove invalid characters
    .replace(/^[-_]+|[-_]+$/g, "") // Trim leading/trailing underscores/hyphens
    .replace(/[-_]{2,}/g, "_"); // Replace multiple consecutive special chars
}

/**
 * Generates a key from a name/title
 * @param name - The name to convert
 * @returns A valid key
 */
export function nameToKey(name: string): string {
  return toKey(name);
}

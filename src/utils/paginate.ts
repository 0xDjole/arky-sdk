import { ArkyError } from "../types/apiError";
import type { PaginatedResponse } from "../types/common";

export interface PaginateOptions {
  max_pages?: number;
}

export type PageRead<T> = (cursor: string | null) => Promise<PaginatedResponse<T>>;

const defaultMaxPages = 1000;

function maxPages(options: PaginateOptions | undefined): number {
  const value = options?.max_pages ?? defaultMaxPages;
  if (!Number.isInteger(value) || value < 1) throw new TypeError("max_pages is a whole number of at least 1");
  return value;
}

export async function* paginate<T>(read: PageRead<T>, options?: PaginateOptions): AsyncGenerator<T, void, undefined> {
  const limit = maxPages(options);
  const seen = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < limit; page += 1) {
    const result = await read(cursor);
    if (!result || !Array.isArray(result.items)) throw new TypeError("A page read must answer { items, cursor }");
    yield* result.items;
    const next = result.cursor;
    if (next === null || next === undefined) return;
    if (typeof next !== "string" || next.length === 0) throw new TypeError("A page cursor is a non-empty string or null");
    if (next === cursor || seen.has(next)) throw new ArkyError("answer_mismatch", "The page cursor did not advance");
    seen.add(next);
    cursor = next;
  }
  throw new ArkyError("too_many_pages", `The list has more than ${limit} pages; raise max_pages or narrow the read`);
}

export async function readAllPages<T>(read: PageRead<T>, options?: PaginateOptions): Promise<T[]> {
  const items: T[] = [];
  for await (const item of paginate(read, options)) items.push(item);
  return items;
}

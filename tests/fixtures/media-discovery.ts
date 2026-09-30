import { createAdmin, createStorefront } from '../../dist/index.js';
import type { FindMediaParams, Media } from '../../dist/index.js';

const filters: FindMediaParams = { store_id: '3f8b6d21-c7a4-4e09-9d15-7b2e0a4c6f18', query: 'invoice', mime_type: 'application', sort_field: 'original_file_name', sort_direction: 'asc', cursor: null, limit: 1 };
declare const admin: ReturnType<typeof createAdmin>;
declare const storefront: ReturnType<typeof createStorefront>;
const page: Promise<{ items: Media[]; cursor: string | null }> = admin.media.find(filters);
const references: Promise<Media[]> = storefront.media.findByIds({ ids: ['second', 'first'] });
// @ts-expect-error Media has no title ordering.
filters.sort_field = 'title';
// @ts-expect-error Unsupported MIME values are not search filters.
filters.mime_type = 'application/octet-stream';
// @ts-expect-error Exact reference reads do not accept discovery controls.
void storefront.media.findByIds({ ids: ['media'], query: 'ignored' });
// @ts-expect-error Storefront scope is resolved from the public key.
void storefront.media.findByIds({ ids: ['media'], store_id: 'foreign' });
void [page, references];

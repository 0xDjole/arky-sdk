import { createAdmin, createStorefront } from '../../dist/index.js';
import type { FindMediaParams, Media, MediaContent } from '../../dist/index.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

const filters: FindMediaParams = { store_id: '3f8b6d21-c7a4-4e09-9d15-7b2e0a4c6f18', query: 'invoice', type: 'pdf', sort_field: 'file_name', sort_direction: 'asc', cursor: null, limit: 1 };
declare const admin: ReturnType<typeof createAdmin>;
declare const storefront: ReturnType<typeof createStorefront>;
const page: Promise<{ items: Media[]; cursor: string | null }> = admin.media.find(filters);
const references: Promise<Media[]> = storefront.media.findByIds({ ids: ['second', 'first'] });
void [page, references];

export type MediaDiscoveryContracts = [
  Assert<Equal<FindMediaParams['sort_field'], 'file_name' | 'created_at' | 'updated_at' | undefined>>,
  Assert<Equal<FindMediaParams['type'], 'image' | 'video' | 'pdf' | undefined>>,
  Assert<Missing<FindMediaParams, 'mime_type'>>,
  Assert<Equal<keyof Parameters<typeof storefront.media.findByIds>[0], 'ids'>>,
  Assert<Equal<MediaContent['type'], 'image' | 'video' | 'pdf'>>,
  Assert<Equal<Extract<MediaContent, { type: 'pdf' }>['original']['url'], string>>,
];

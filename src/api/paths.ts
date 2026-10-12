import { requireStoreId } from "../utils/storeTarget";

export function segment(value: string): string {
  return encodeURIComponent(value);
}

export function storePath(storeId: string, path: string): string {
  return `/v1/stores/${requireStoreId(storeId)}/${path}`;
}

export function storeRecordPath(storeId: string, collection: string, id: string): string {
  return `${storePath(storeId, collection)}/${segment(id)}`;
}

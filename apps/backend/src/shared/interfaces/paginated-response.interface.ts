import type { PaginatedResponse, PaginationMeta } from '@workspace/types';

export type { PaginatedResponse, PaginationMeta } from '@workspace/types';

export function createPaginatedResponse<T, K extends string>(
  key: K,
  data: T[],
  meta: PaginationMeta,
): PaginatedResponse<T, K> {
  return {
    [key]: data,
    meta,
  } as PaginatedResponse<T, K>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

export type PaginatedResponse<T, K extends string> = {
  [P in K]: T[];
} & {
  meta: PaginationMeta;
};

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

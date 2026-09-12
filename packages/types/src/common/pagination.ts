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

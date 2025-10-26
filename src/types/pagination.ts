/**
 * Pagination types
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPaginationDefaults(params: PaginationParams): Required<PaginationParams> {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };
}

export function calculatePagination(
  total: number,
  page: number,
  limit: number
): Pick<PaginatedResult<unknown>, 'total' | 'page' | 'limit' | 'totalPages'> {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

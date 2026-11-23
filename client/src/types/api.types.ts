/**
 * Contratos de datos genéricos para la comunicación con la API REST de Cumpa.
 */

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface ApiValidationError {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: ApiValidationError[] | Record<string, string[]>;
  statusCode?: number;
  timestamp?: string;
}

export interface PaginationMeta {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

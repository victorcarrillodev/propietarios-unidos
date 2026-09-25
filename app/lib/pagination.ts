import { pageParam } from "./validation";

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

export interface PaginationMeta extends PaginationParams {
  total: number;
  pageCount: number;
}

/**
 * Extrae y normaliza los parámetros de paginación de la URL (página actual, límite y offset)
 * para consultas SQL / ORM.
 */
export function getPaginationParams(
  url: URL,
  defaultPageSize = 25,
  paramName = "page",
): PaginationParams {
  const page = pageParam(url, paramName);
  const pageSize = Math.max(1, defaultPageSize);
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
    limit: pageSize,
  };
}

/**
 * Calcula los metadatos completos de paginación a partir de los parámetros y el total de registros.
 */
export function getPaginationMeta(
  params: PaginationParams,
  total: number,
): PaginationMeta {
  const safeTotal = Math.max(0, Number.isFinite(total) ? Math.floor(total) : 0);
  const pageCount = Math.max(1, Math.ceil(safeTotal / params.pageSize));

  return {
    ...params,
    total: safeTotal,
    pageCount,
  };
}

/**
 * Helper unificado para calcular paginación completa cuando el total ya se conoce de antemano.
 */
export function paginate(
  url: URL,
  total: number,
  defaultPageSize = 25,
  paramName = "page",
): PaginationMeta {
  const params = getPaginationParams(url, defaultPageSize, paramName);
  return getPaginationMeta(params, total);
}

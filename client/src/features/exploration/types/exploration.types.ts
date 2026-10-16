/**
 * Contratos de tipos TypeScript para el Módulo de Exploración y Búsqueda de Mascotas.
 */

export type AnimalSpecies = 'PERRO' | 'GATO' | 'OTRO';

export type AnimalSex = 'MACHO' | 'HEMBRA';

export type AnimalSize = 'CHICO' | 'MEDIANO' | 'GRANDE';

export type AnimalAgeCategory = 'CACHORRO' | 'JOVEN' | 'ADULTO' | 'SENIOR';

export type AnimalModality = 'ADOPCION_DEFINITIVA' | 'TRANSITO_TEMPORARIO' | 'AMBAS';

export type AnimalStatus =
  | 'DISPONIBLE'
  | 'EN_PROCESO'
  | 'ADOPTADO'
  | 'EN_TRANSITO'
  | 'PAUSADA'
  | 'CANCELADA';

export interface AnimalPublisherSummary {
  id: string;
  name: string;
  role: 'PARTICULAR' | 'VETERINARIA' | 'INSTITUCION' | 'ADMIN';
  isVerifiedInstitution: boolean;
}

/**
 * Resumen de animal en la grilla del catálogo (GET /api/animals)
 */
export interface AnimalSummary {
  id: string;
  name: string;
  species: AnimalSpecies;
  breed?: string | null;
  sex: AnimalSex;
  size: AnimalSize;
  ageCategory: AnimalAgeCategory;
  modality: AnimalModality;
  status: AnimalStatus;
  province: string;
  city: string;
  mainImage: string | null;
  createdAt: string;
  publisher: AnimalPublisherSummary;
}

/**
 * Parámetros de consulta y filtrado (Query Params)
 */
export interface PetQueryParams {
  page?: number;
  limit?: number;
  species?: AnimalSpecies;
  sex?: AnimalSex;
  size?: AnimalSize;
  ageCategory?: AnimalAgeCategory;
  modality?: AnimalModality;
  province?: string;
  city?: string;
  search?: string;
  vaccinated?: boolean;
  dewormed?: boolean;
  castrated?: boolean;
}

/**
 * Respuesta paginada del backend al consultar animales
 */
export interface PaginatedAnimalsResponse {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: AnimalSummary[];
}

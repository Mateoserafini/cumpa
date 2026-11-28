import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  PetQueryParams,
  PaginatedAnimalsResponse,
} from '../types/exploration.types';
import type { DetailedAnimal } from '@/features/pets/components/PetDetailHero';

/**
 * Servicio para consulta y exploración del catálogo público de animales.
 */
export const explorationService = {
  /**
   * Obtiene la lista paginada de animales disponibles con filtros opcionales.
   * Endpoint: GET /api/animals
   */
  async getAnimals(params?: PetQueryParams): Promise<PaginatedAnimalsResponse> {
    const response = await apiClient.get<PaginatedAnimalsResponse>(
      ENDPOINTS.ANIMALS.LIST,
      { params }
    );
    return response.data;
  },

  /**
   * Obtiene la ficha detallada de un animal por su ID único.
   * Endpoint: GET /api/animals/:id
   */
  async getAnimalById(id: string): Promise<DetailedAnimal> {
    const response = await apiClient.get<DetailedAnimal>(
      ENDPOINTS.ANIMALS.DETAIL(id)
    );
    return response.data;
  },
};

export default explorationService;

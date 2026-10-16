import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  CreateAnimalPayload,
  CreateAnimalResponse,
  MyPublicationItem,
} from '../types/pet.types';
import type { AnimalStatus } from '@/features/exploration/types/exploration.types';

/**
 * Servicio para gestión y alta de publicaciones de animales.
 */
export const petService = {
  /**
   * Crea una nueva publicación de animal enviando imágenes vía Multipart/Form-Data.
   * Endpoint: POST /api/animals
   */
  async createAnimal(
    payload: CreateAnimalPayload | FormData
  ): Promise<CreateAnimalResponse> {
    let formData: FormData;

    if (payload instanceof FormData) {
      formData = payload;
    } else {
      formData = new FormData();
      formData.append('name', payload.name);
      formData.append('species', payload.species);
      if (payload.breed) formData.append('breed', payload.breed);
      formData.append('sex', payload.sex);
      formData.append('size', payload.size);
      formData.append('ageCategory', payload.ageCategory);
      if (payload.approximateAgeMonths) {
        formData.append('approximateAgeMonths', String(payload.approximateAgeMonths));
      }
      formData.append('description', payload.description);
      if (payload.healthDetails) formData.append('healthDetails', payload.healthDetails);
      formData.append('isNeutered', String(Boolean(payload.isNeutered)));
      formData.append('isVaccinated', String(Boolean(payload.isVaccinated)));
      formData.append('isDewormed', String(Boolean(payload.isDewormed)));
      formData.append('specialNeeds', String(Boolean(payload.specialNeeds)));
      if (payload.specialNeedsDescription) {
        formData.append('specialNeedsDescription', payload.specialNeedsDescription);
      }
      formData.append('modality', payload.modality);
      formData.append('province', payload.province);
      formData.append('city', payload.city);

      // Adjuntar archivos de imagen
      if (payload.images && payload.images.length > 0) {
        payload.images.forEach((file) => {
          formData.append('images', file);
        });
      }
    }

    const response = await apiClient.post<CreateAnimalResponse>(
      ENDPOINTS.ANIMALS.CREATE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Obtiene todas las publicaciones creadas por el usuario autenticado.
   * Endpoint: GET /api/animals/my-publications
   */
  async getMyPublications(): Promise<MyPublicationItem[]> {
    const response = await apiClient.get<MyPublicationItem[]>(
      ENDPOINTS.ANIMALS.MY_PUBLICATIONS
    );
    return response.data;
  },

  /**
   * Actualiza el estado operativo de la publicación (DISPONIBLE, EN_PROCESO, PAUSADA, CANCELADA).
   * Endpoint: PATCH /api/animals/:id/status
   */
  async updateStatus(
    id: string,
    status: AnimalStatus
  ): Promise<{ message: string; newStatus: AnimalStatus }> {
    const response = await apiClient.patch<{ message: string; newStatus: AnimalStatus }>(
      ENDPOINTS.ANIMALS.UPDATE_STATUS(id),
      { status }
    );
    return response.data;
  },

  /**
   * Aplica baja lógica a una publicación de animal.
   * Endpoint: DELETE /api/animals/:id
   */
  async deleteAnimal(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      ENDPOINTS.ANIMALS.DELETE(id)
    );
    return response.data;
  },
};

export default petService;

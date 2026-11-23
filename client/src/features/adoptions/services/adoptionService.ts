import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  SubmitApplicationPayload,
  SubmitApplicationResponse,
  AdoptionRequestItem,
  RequestStatus,
} from '../types/adoption.types';

/**
 * Servicio para envío y resolución de solicitudes de adopción y tránsito.
 */
export const adoptionService = {
  /**
   * Envía una nueva postulación de adopción o tránsito para un animal.
   * Endpoint: POST /api/contacts/apply
   */
  async apply(payload: SubmitApplicationPayload): Promise<SubmitApplicationResponse> {
    const response = await apiClient.post<SubmitApplicationResponse>(
      ENDPOINTS.CONTACTS.APPLY,
      payload
    );
    return response.data;
  },

  /**
   * Obtiene el listado de postulaciones enviadas por el adoptante autenticado.
   * Endpoint: GET /api/contacts/my-applications
   */
  async getMyApplications(): Promise<AdoptionRequestItem[]> {
    const response = await apiClient.get<AdoptionRequestItem[]>(
      ENDPOINTS.CONTACTS.MY_APPLICATIONS
    );
    return response.data;
  },

  /**
   * Obtiene la bandeja de postulaciones recibidas para un animal publicado.
   * Endpoint: GET /api/contacts/animal/:animalId
   */
  async getApplicationsByAnimal(animalId: string): Promise<AdoptionRequestItem[]> {
    const response = await apiClient.get<AdoptionRequestItem[]>(
      ENDPOINTS.CONTACTS.BY_ANIMAL(animalId)
    );
    return response.data;
  },

  /**
   * Actualiza el dictamen de una solicitud (APROBADA, RECHAZADA, EN_REVISION).
   * Al aprobar, el backend transiciona el animal a ADOPTADO y genera el FollowUp.
   * Endpoint: PATCH /api/contacts/:id/status
   */
  async updateStatus(
    id: string,
    status: Extract<RequestStatus, 'APROBADA' | 'RECHAZADA' | 'EN_REVISION'>,
    rejectionReason?: string
  ): Promise<{ message: string; followUpCreated?: boolean; followUpId?: string }> {
    const response = await apiClient.patch(ENDPOINTS.CONTACTS.UPDATE_STATUS(id), {
      status,
      rejectionReason,
    });
    return response.data;
  },
};

export default adoptionService;

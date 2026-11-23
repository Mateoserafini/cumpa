import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import type { FollowUpItem } from '../types/tracking.types';

/**
 * Servicio para consulta y supervisión de expedientes de seguimiento post-adopción.
 */
export const trackingService = {
  /**
   * Obtiene los expedientes donde el usuario en sesión es tutor/publicador supervisor.
   * Endpoint: GET /api/followups/as-guardian
   */
  async getAsGuardian(): Promise<FollowUpItem[]> {
    const response = await apiClient.get<FollowUpItem[]>(
      ENDPOINTS.FOLLOW_UPS.AS_GUARDIAN
    );
    return response.data;
  },

  /**
   * Obtiene los expedientes donde el usuario en sesión es el adoptante adjudicado.
   * Endpoint: GET /api/followups/as-adopter
   */
  async getAsAdopter(): Promise<FollowUpItem[]> {
    const response = await apiClient.get<FollowUpItem[]>(
      ENDPOINTS.FOLLOW_UPS.AS_ADOPTER
    );
    return response.data;
  },

  /**
   * Obtiene el detalle individual de un expediente y su cronograma mensual.
   * Endpoint: GET /api/followups/:id
   */
  async getFollowUpById(id: string): Promise<FollowUpItem> {
    const response = await apiClient.get<FollowUpItem>(
      ENDPOINTS.FOLLOW_UPS.DETAIL(id)
    );
    return response.data;
  },

  /**
   * Carga la fotografía y notas del reporte mensual correspondiente por parte del adoptante.
   * Endpoint: POST /api/followups/:followUpId/report/:monthNumber
   */
  async submitMonthlyReport(
    followUpId: string,
    monthNumber: number,
    imageFile: File,
    notes?: string
  ): Promise<{ message: string; reportId: string; monthNumber: number; status: string; submittedAt: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (notes) formData.append('notes', notes);

    const response = await apiClient.post(
      ENDPOINTS.FOLLOW_UPS.SUBMIT_REPORT(followUpId, monthNumber),
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
   * Registra el dictamen de revisión del tutor sobre un reporte mensual.
   * Endpoint: PATCH /api/followups/report/:reportId/review
   */
  async reviewReport(
    reportId: string,
    reviewedByGuardian: boolean,
    guardianFeedback?: string
  ): Promise<{ message: string }> {
    const response = await apiClient.patch(
      ENDPOINTS.FOLLOW_UPS.REVIEW_REPORT(reportId),
      {
        reviewedByGuardian,
        guardianFeedback,
      }
    );
    return response.data;
  },
};

export default trackingService;

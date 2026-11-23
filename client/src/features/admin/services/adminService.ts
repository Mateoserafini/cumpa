import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  AdminStats,
  PendingInstitution,
  PaginatedReports,
} from '../types/admin.types';

export const adminService = {
  /**
   * Obtiene métricas e indicadores de rendimiento de la plataforma.
   */
  async getStats(): Promise<AdminStats> {
    const response = await apiClient.get<AdminStats>(ENDPOINTS.ADMIN.STATS);
    return response.data;
  },

  /**
   * Obtiene la cola de organizaciones con personería pendiente de verificación.
   */
  async getPendingInstitutions(): Promise<PendingInstitution[]> {
    const response = await apiClient.get<PendingInstitution[]>(
      ENDPOINTS.ADMIN.INSTITUTIONS_PENDING
    );
    return response.data;
  },

  /**
   * Dictamina la aprobación o rechazo de una institución.
   */
  async verifyInstitution(
    id: string,
    status: 'APROBADA' | 'RECHAZADA',
    notes?: string
  ): Promise<{ message: string; institutionId: string; newStatus: string }> {
    const response = await apiClient.patch(ENDPOINTS.ADMIN.VERIFY_INSTITUTION(id), {
      status,
      notes,
    });
    return response.data;
  },

  /**
   * Obtiene el listado de denuncias registradas por los usuarios.
   */
  async getReports(params?: {
    status?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedReports> {
    const response = await apiClient.get<PaginatedReports>(ENDPOINTS.ADMIN.REPORTS, {
      params,
    });
    return response.data;
  },

  /**
   * Dictamina la resolución de una denuncia ciudadana y aplica sanciones.
   */
  async resolveReport(
    id: string,
    payload: {
      status: 'RESUELTO' | 'DESESTIMADO';
      resolutionNotes: string;
      takeAction?: 'BAN_USER' | 'DELETE_ANIMAL' | 'NONE';
    }
  ): Promise<{ message: string; reportId: string; status: string }> {
    const response = await apiClient.patch(
      ENDPOINTS.ADMIN.RESOLVE_REPORT(id),
      payload
    );
    return response.data;
  },
};

export default adminService;


import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import type { User } from '../types/auth.types';

export const usersService = {
  /**
   * Obtiene los datos completos del perfil del usuario logueado.
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(ENDPOINTS.USERS.PROFILE);
    return response.data;
  },

  /**
   * Actualiza los datos personales de contacto del perfil.
   */
  async updateProfile(data: {
    name?: string;
    phone?: string;
    province?: string;
    city?: string;
    address?: string;
    avatarUrl?: string;
  }): Promise<{ message: string; user: User }> {
    const response = await apiClient.put<{ message: string; user: User }>(
      ENDPOINTS.USERS.PROFILE,
      data
    );
    return response.data;
  },

  /**
   * Presenta la documentación de CUIT para verificación de personería institucional.
   */
  async submitInstitutionalVerification(formData: FormData): Promise<{
    message: string;
    profileId: string;
    status: string;
  }> {
    const response = await apiClient.post(
      ENDPOINTS.USERS.INSTITUTIONAL_VERIFICATION,
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
   * Consulta el estado actual de personería de la entidad.
   */
  async getInstitutionalStatus(): Promise<any> {
    const response = await apiClient.get(ENDPOINTS.USERS.INSTITUTIONAL_STATUS);
    return response.data;
  },
};

export default usersService;


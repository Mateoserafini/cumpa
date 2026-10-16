import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { storage } from '@/utils/storage';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
  User,
  ResetPasswordRequest,
} from '../types/auth.types';

/**
 * Servicio de Autenticación de Cumpa.
 * Realiza las llamadas a los endpoints `/api/auth/*` a través de apiClient.
 */
export const authService = {
  /**
   * Inicia sesión con credenciales tradicionales (email y contraseña).
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    const data = response.data;
    if (data.token) {
      storage.setToken(data.token);
    }
    return data;
  },

  /**
   * Registra un nuevo usuario en la plataforma.
   */
  async register(data: RegisterCredentials): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  },

  /**
   * Obtiene la información del usuario actualmente autenticado (/api/auth/me).
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>(ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Cierra la sesión activa eliminando el token de almacenamiento local.
   */
  logout(): void {
    storage.removeToken();
  },

  /**
   * Reenvía el correo de verificación para cuentas pendientes de activación.
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email }
    );
    return response.data;
  },

  /**
   * Solicita el enlace de recuperación de contraseña.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    );
    return response.data;
  },

  /**
   * Restablece la contraseña utilizando el token enviado por correo.
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
    return response.data;
  },
};

export default authService;

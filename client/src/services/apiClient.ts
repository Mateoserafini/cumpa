import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { storage } from '@/utils/storage';
import type { ApiErrorResponse } from '@/types/api.types';

// URL base de la API tomada del archivo de entorno .env con fallback local
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Instancia central de Axios para toda la comunicación HTTP con la API de Cumpa.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Interceptor de Solicitud (Request):
 * Inyecta automáticamente el token JWT como Bearer token en el encabezado Authorization
 * en todas las peticiones si el usuario está autenticado.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de Respuesta (Response):
 * Manejo centralizado de errores HTTP (401, 403, 429, 500) y normalización del mensaje de error.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, se retorna tal cual
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      // Error de red / backend inaccesible
      const networkErrorMessage =
        'No se pudo conectar con el servidor. Verifique su conexión o intente nuevamente más tarde.';
      return Promise.reject(new Error(networkErrorMessage));
    }

    const { status, data } = error.response;

    // Manejo específico según código de estado HTTP
    switch (status) {
      case 401: {
        // Token inválido o expirado
        storage.removeToken();
        // Emitimos un evento global para que AuthContext sincronice el estado
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cumpa:unauthorized'));
        }
        break;
      }

      case 403: {
        // Correo no verificado o permisos insuficientes
        console.warn('Acceso denegado (403):', data?.message || 'Permisos insuficientes.');
        break;
      }

      case 429: {
        // Rate limiting (ej. más de 3 intentos fallidos de login)
        console.warn('Límite de solicitudes superado (429):', data?.message);
        break;
      }

      case 500: {
        // Error interno no controlado del servidor
        console.error('Error interno del servidor (500):', data?.message);
        break;
      }

      default:
        break;
    }

    // Normalizar mensaje de error para los consumidores
    const extractedMessage =
      data?.message ||
      (Array.isArray(data?.errors)
        ? data?.errors.map((e) => e.message).join('. ')
        : error.message) ||
      'Ha ocurrido un error inesperado al procesar la solicitud.';

    const normalizedError = new Error(extractedMessage);
    // Preservamos la respuesta original de Axios adjunta al error
    Object.assign(normalizedError, {
      status,
      data,
      isAxiosError: true,
      originalError: error,
    });

    return Promise.reject(normalizedError);
  }
);

export default apiClient;

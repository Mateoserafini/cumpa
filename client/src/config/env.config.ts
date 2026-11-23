/**
 * Configuración centralizada de variables de entorno para el cliente Vite de Cumpa.
 * Garantiza compatibilidad tanto con VITE_API_BASE_URL como con VITE_API_URL,
 * y normaliza la URL para asegurar que siempre apunte a /api sin importar
 * si se configuró con o sin barra final o sin el segmento /api.
 */
const rawUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api';

const cleanUrl = rawUrl.replace(/\/+$/, '');
const normalizedApiUrl = cleanUrl.endsWith('/api')
  ? cleanUrl
  : `${cleanUrl}/api`;

export const ENV = {
  API_URL: normalizedApiUrl,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Cumpa 🐾',
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,
} as const;

export default ENV;


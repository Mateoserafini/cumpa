/**
 * Configuración centralizada de variables de entorno para el cliente Vite de Cumpa.
 * Garantiza compatibilidad tanto con VITE_API_BASE_URL como con VITE_API_URL.
 */
export const ENV = {
  API_URL:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Cumpa 🐾',
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,
} as const;

export default ENV;


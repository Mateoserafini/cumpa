/**
 * Constantes con las rutas de endpoints de la API REST de Cumpa.
 */
export const ENDPOINTS = {
  // 1. Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    VERIFY_EMAIL: (token: string) => `/auth/verify-email/${token}`,
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
  },

  // 2. Usuarios y Perfiles
  USERS: {
    PROFILE: '/users/profile',
    INSTITUTIONAL_VERIFICATION: '/users/institutional-verification',
    INSTITUTIONAL_STATUS: '/users/institutional-status',
  },

  // 3. Animales
  ANIMALS: {
    LIST: '/animals',
    DETAIL: (id: string) => `/animals/${id}`,
    MY_PUBLICATIONS: '/animals/my-publications',
    CREATE: '/animals',
    UPDATE: (id: string) => `/animals/${id}`,
    UPDATE_STATUS: (id: string) => `/animals/${id}/status`,
    DELETE: (id: string) => `/animals/${id}`,
  },

  // 4. Contactos y Postulaciones
  CONTACTS: {
    APPLY: '/contacts/apply',
    MY_APPLICATIONS: '/contacts/my-applications',
    BY_ANIMAL: (animalId: string) => `/contacts/animal/${animalId}`,
    UPDATE_STATUS: (id: string) => `/contacts/${id}/status`,
  },

  // 5. Seguimiento Post-Adopción
  FOLLOW_UPS: {
    AS_ADOPTER: '/followups/as-adopter',
    AS_GUARDIAN: '/followups/as-guardian',
    DETAIL: (id: string) => `/followups/${id}`,
    SUBMIT_REPORT: (followUpId: string, monthNumber: number) =>
      `/followups/${followUpId}/report/${monthNumber}`,
    REVIEW_REPORT: (reportId: string) => `/followups/report/${reportId}/review`,
  },

  // 6. Administración
  ADMIN: {
    REPORTS: '/admin/reports',
    RESOLVE_REPORT: (id: string) => `/admin/reports/${id}/resolve`,
    INSTITUTIONS_PENDING: '/admin/institutions/pending',
    VERIFY_INSTITUTION: (id: string) => `/admin/institutions/${id}/verify`,
    STATS: '/admin/stats',
  },
} as const;

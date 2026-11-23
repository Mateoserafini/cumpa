/**
 * Tipos de datos e interfaces para el Módulo de Autenticación y Usuarios de Cumpa.
 */

export type UserRole = 'PARTICULAR' | 'VETERINARIA' | 'INSTITUCION' | 'ADMIN';

export type InstitutionalVerificationStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface InstitutionalProfile {
  id: string;
  userId: string;
  legalName: string;
  cuit: string;
  verificationStatus: InstitutionalVerificationStatus;
  verificationNotes?: string | null;
  verifiedAt?: string | null;
  documentUrl?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  province?: string;
  city?: string;
  address?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  institutionalProfile?: InstitutionalProfile | null;
}

/**
 * Payload para inicio de sesión con email y contraseña.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta del servidor tras un inicio de sesión exitoso.
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isEmailVerified: boolean;
    avatarUrl: string | null;
  };
}

/**
 * Payload para registro de nuevo usuario (Particular, Veterinaria o Institución).
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role: 'PARTICULAR' | 'VETERINARIA' | 'INSTITUCION';
  province: string;
  city: string;
  phone?: string;
}

/**
 * Respuesta del backend al registrar una nueva cuenta.
 */
export interface RegisterResponse {
  message: string;
  userId: string;
}

/**
 * Payload para recuperar contraseña.
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Payload para restablecer contraseña con token.
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Estado general del contexto de autenticación.
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

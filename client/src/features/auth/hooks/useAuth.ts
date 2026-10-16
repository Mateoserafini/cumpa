import { useAuthContext } from '@/context/AuthContext';

/**
 * Custom hook para acceder al estado y acciones de autenticación.
 * Proporciona flags convenientes para control de roles y estados de verificación.
 */
export const useAuth = () => {
  const context = useAuthContext();

  const role = context.user?.role;
  const institutionalStatus = context.user?.institutionalProfile?.verificationStatus;

  return {
    ...context,
    // Helpers de rol
    isAdmin: role === 'ADMIN',
    isInstitution: role === 'INSTITUCION' || role === 'VETERINARIA',
    isParticular: role === 'PARTICULAR',
    isVeterinaria: role === 'VETERINARIA',

    // Helpers de estado institucional
    isVerifiedInstitution: institutionalStatus === 'APROBADA',
    isPendingInstitution: institutionalStatus === 'PENDIENTE',
    isRejectedInstitution: institutionalStatus === 'RECHAZADA',
  };
};

export default useAuth;

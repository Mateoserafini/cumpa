import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
  CheckCircle,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const {
    user,
    logout,
    isAdmin,
    isInstitution,
    isVerifiedInstitution,
    isPendingInstitution,
  } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Banner de Bienvenida */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-8 text-white flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-3xl font-extrabold uppercase shadow-inner">
            {user?.name ? user.name[0] : <UserIcon className="w-10 h-10" />}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {user?.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                {user?.role}
              </span>
            </div>
            <p className="text-brand-100 text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white shadow-none"
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Detalles del Perfil */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Datos de la Cuenta
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div className="text-sm">
                    <span className="text-xs text-slate-500 block">Correo Electrónico</span>
                    <span className="font-medium text-slate-900">{user?.email}</span>
                  </div>
                  {user?.isEmailVerified ? (
                    <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" /> Verificado
                    </span>
                  ) : (
                    <span className="ml-auto flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> Sin verificar
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div className="text-sm">
                    <span className="text-xs text-slate-500 block">Teléfono de Contacto</span>
                    <span className="font-medium text-slate-900">
                      {user?.phone || 'No especificado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div className="text-sm">
                    <span className="text-xs text-slate-500 block">Ubicación</span>
                    <span className="font-medium text-slate-900">
                      {user?.city ? `${user.city}, ${user.province}` : 'No especificada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado de Personería / Rol */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Tipo de Actor y Permisos
              </h3>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                    {isAdmin ? (
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                    ) : isInstitution ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isAdmin
                        ? 'Administrador General'
                        : isInstitution
                        ? 'Institución Protectora / Veterinaria'
                        : 'Adoptante / Tutor Particular'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      ID de usuario: <span className="font-mono text-[11px]">{user?.id}</span>
                    </p>
                  </div>
                </div>

                {isInstitution && (
                  <div className="pt-3 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 block mb-1">Estado de Verificación:</span>
                    {isVerifiedInstitution ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Personería Aprobada
                      </span>
                    ) : isPendingInstitution ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> En Revisión por el Administrador
                      </span>
                    ) : (
                      <span className="text-slate-500">Sin trámite iniciado</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

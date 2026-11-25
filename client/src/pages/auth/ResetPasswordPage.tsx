import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams<{ token?: string }>();
  const token = (searchParams.get('token') || params.token || '').trim();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newPassword) {
      errors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/\d/.test(newPassword)) {
      errors.newPassword = 'La contraseña debe contener al menos un número';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Debe confirmar la nueva contraseña';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authService.resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message ||
          'El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Enlace incompleto o inválido</h2>
            <p className="text-sm text-slate-500 mt-1">
              No encontramos el token de recuperación en la dirección ingresada.
            </p>
          </div>
          <Link to="/recuperar-clave" className="block">
            <Button variant="primary" size="lg" className="w-full font-semibold">
              Solicitar un nuevo enlace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Nueva Contraseña
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Elige una clave segura para volver a ingresar a Cumpa
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="font-semibold text-emerald-900">¡Contraseña actualizada!</p>
              <p className="text-xs text-emerald-800">
                Tu clave se modificó correctamente. Ya podés iniciar sesión con tus nuevas credenciales.
              </p>
            </div>

            <Link to="/login" className="block">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md shadow-brand-600/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Ir a Iniciar Sesión
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-6">
                <Alert
                  variant="error"
                  title="No se pudo restablecer la clave"
                  onClose={() => setErrorMessage(null)}
                >
                  {errorMessage}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                label="Nueva Contraseña"
                placeholder="Mínimo 8 caracteres y un número"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) {
                    setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                  }
                }}
                error={fieldErrors.newPassword}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600 focus:outline-none transition p-1"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                label="Confirmar Nueva Contraseña"
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                error={fieldErrors.confirmPassword}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 font-semibold shadow-md shadow-brand-600/20"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Guardar Nueva Contraseña
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link
                to="/recuperar-clave"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline transition"
              >
                ¿El enlace venció? Solicita uno nuevo aquí
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

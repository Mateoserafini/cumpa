import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';
import { GoogleAuthButton } from './GoogleAuthButton';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ruta previa a la que el usuario intentaba acceder o el Home por defecto
  const fromLocation =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Ingrese un formato de correo electrónico válido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email.trim()) return;
    setResendStatus('loading');
    try {
      await authService.resendVerification(formData.email.trim());
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setResendStatus('idle');

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirige al Home ('/') o a la página que intentó abrir antes del login
        navigate(fromLocation === '/login' ? '/' : fromLocation, { replace: true });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || 'Credenciales inválidas. Por favor verifique sus datos.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailUnverified =
    errorMessage?.toLowerCase().includes('verificar') ||
    errorMessage?.toLowerCase().includes('activación');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
        {/* Cabecera del formulario */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 shadow-inner">
            <span className="text-2xl" role="img" aria-label="Patita Cumpa">🐾</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bienvenido a Cumpa
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        {/* Alerta de error visual */}
        {errorMessage && (
          <div className="mb-6 space-y-2">
            <Alert
              variant="error"
              title="Error al iniciar sesión"
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>

            {/* Ayuda interactiva si el email no está verificado */}
            {isEmailUnverified && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>¿No recibiste el correo?</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleResendVerification}
                  disabled={resendStatus !== 'idle'}
                  isLoading={resendStatus === 'loading'}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="py-1 px-2.5 text-xs bg-amber-200/60 hover:bg-amber-200 text-amber-900 border-none"
                >
                  {resendStatus === 'sent' ? 'Enviado ✔' : 'Reenviar enlace'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Botón de autenticación con Google */}
        <div className="mb-6">
          <GoogleAuthButton isLoading={isSubmitting} />
        </div>

        {/* Divisor con texto */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-medium">
            O con correo electrónico
          </span>
        </div>

        {/* Formulario tradicional */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico"
            placeholder="ejemplo@cumpa.org"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            disabled={isSubmitting}
            required
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              disabled={isSubmitting}
              required
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-slate-600 focus:outline-none transition p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <div className="flex justify-end mt-1.5">
              <Link
                to="/recuperar-clave"
                className="text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline transition"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 font-semibold shadow-md shadow-brand-600/20"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Iniciar Sesión
          </Button>
        </form>

        {/* Footer con enlace a registro */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            ¿Aún no tienes una cuenta?{' '}
            <Link
              to="/registro"
              className="font-semibold text-brand-700 hover:text-brand-800 hover:underline transition"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

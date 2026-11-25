import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmed) {
      setFieldError('El correo electrónico es obligatorio');
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setFieldError('Ingrese un formato de correo electrónico válido');
      return;
    }

    setIsSubmitting(true);
    setFieldError('');
    setErrorMessage(null);

    try {
      const response = await authService.forgotPassword(trimmed);
      setSuccessMessage(
        response.message ||
          'Si el correo coincide con una cuenta activa, recibirás las instrucciones para restablecer tu contraseña.'
      );
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || 'No fue posible procesar la solicitud. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Recuperar Contraseña
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tu correo y te enviaremos un enlace para crear una nueva clave
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="font-semibold text-emerald-900">¡Solicitud enviada!</p>
              <p className="text-xs text-emerald-800">{successMessage}</p>
            </div>

            <p className="text-xs text-slate-500">
              Revisa también tu carpeta de correo no deseado (spam). El enlace vence en 1 hora.
            </p>

            <Link to="/login" className="block">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md shadow-brand-600/20"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Volver a Iniciar Sesión
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-6">
                <Alert
                  variant="error"
                  title="Error"
                  onClose={() => setErrorMessage(null)}
                >
                  {errorMessage}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="email"
                name="email"
                type="email"
                label="Correo Electrónico"
                placeholder="ejemplo@cumpa.org"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError('');
                  if (errorMessage) setErrorMessage(null);
                }}
                error={fieldError}
                disabled={isSubmitting}
                required
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 font-semibold shadow-md shadow-brand-600/20"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Enviar enlace de recuperación
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

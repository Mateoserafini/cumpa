import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token: routeToken } = useParams<{ token?: string }>();
  const navigate = useNavigate();

  // Soporta tanto ?token=... como /verificar-cuenta/:token
  const token = routeToken || searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);

  // Evita doble ejecución en React 18 Strict Mode
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    if (!token || token.trim().length === 0) {
      setStatus('error');
      setMessage('El enlace de verificación no contiene un token válido o está incompleto.');
      return;
    }

    const activateAccount = async () => {
      try {
        const response = await authService.verifyEmail(token.trim());
        setStatus('success');
        setMessage(
          response.message ||
            'Tu dirección de correo ha sido confirmada exitosamente. Ya puedes ingresar con tu cuenta.'
        );
      } catch (err: any) {
        setStatus('error');
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'El token de verificación es inválido o ya ha expirado.';
        setMessage(errorMessage);
      }
    };

    void activateAccount();
  }, [token]);

  // Cuenta regresiva para redirigir al login en caso de éxito
  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
        {/* 1. Estado Cargando */}
        {status === 'loading' && (
          <div className="py-6 flex flex-col items-center gap-4">
            <Spinner size="xl" variant="brand" />
            <h2 className="text-xl font-bold text-slate-900">
              Verificando tu cuenta...
            </h2>
            <p className="text-sm text-slate-500 max-w-xs">
              Estamos validando tu dirección de correo electrónico en la comunidad Cumpa. Por favor aguarda un instante.
            </p>
          </div>
        )}

        {/* 2. Estado Éxito */}
        {status === 'success' && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              ¡Cuenta activada con éxito! 🎉
            </h2>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {message}
            </p>

            <div className="w-full space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md shadow-brand-600/20"
                onClick={() => navigate('/login', { replace: true })}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Iniciar Sesión
              </Button>

              <p className="text-xs text-slate-400">
                Redirigiendo automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          </div>
        )}

        {/* 3. Estado Error */}
        {status === 'error' && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-sm ring-8 ring-rose-50/50">
              <XCircle className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              No pudimos activar tu cuenta
            </h2>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {message}
            </p>

            <div className="w-full space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-semibold"
                onClick={() => navigate('/login', { replace: true })}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Ir a Iniciar Sesión
              </Button>

              <div className="pt-2">
                <Link
                  to="/"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                >
                  Volver a la página principal
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;

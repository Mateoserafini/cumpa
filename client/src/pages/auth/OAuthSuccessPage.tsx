import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { Spinner } from '@/components/ui/Spinner';

export const OAuthSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      storage.setToken(token);
      void refreshUser().then(() => {
        navigate('/', { replace: true });
      });
    } else {
      console.error('Error de autenticación OAuth:', error);
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-4">
      <Spinner size="xl" variant="brand" />
      <p className="text-sm font-semibold text-slate-700 animate-pulse">
        Finalizando inicio de sesión con Google...
      </p>
    </div>
  );
};

export default OAuthSuccessPage;


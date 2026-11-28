import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { OAuthSuccessPage } from '@/pages/auth/OAuthSuccessPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { authService } from '@/features/auth/services/authService';
import { storage } from '@/utils/storage';
import { ENV } from '@/config/env.config';

vi.mock('@/features/auth/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(() => storage.removeToken()),
    resendVerification: vi.fn(),
    verifyEmail: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe('Auth Flows integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('LoginForm', () => {
    it('shows oauth_failed banner from query string, handles unverified resend, and blocks open redirect', async () => {
      const user = userEvent.setup();

      vi.mocked(authService.login).mockRejectedValueOnce(
        new Error('Debes verificar tu correo electrónico antes de iniciar sesión.')
      );
      vi.mocked(authService.resendVerification).mockResolvedValueOnce({
        message: 'Correo reenviado.',
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/login',
              search: '?error=oauth_failed',
              state: { from: { pathname: '//evil.com' } },
            },
          ]}
        >
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/" element={<div>Home destino seguro</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(
        screen.getByText(/No se pudo completar el inicio de sesión con Google/i)
      ).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Correo Electrónico/i), 'ana@cumpa.org');
      await user.type(screen.getByLabelText(/^Contraseña/i), 'Password1');
      await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /Reenviar enlace/i })).toBeInTheDocument()
      );
      await user.click(screen.getByRole('button', { name: /Reenviar enlace/i }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /Enviado ✔/i })).toBeInTheDocument()
      );
      expect(authService.resendVerification).toHaveBeenCalledWith('ana@cumpa.org');

      // Second attempt succeeds -> must redirect to safe "/" rather than "//evil.com"
      vi.mocked(authService.login).mockResolvedValueOnce({
        token: 'ok-jwt',
        user: {
          id: 'u1',
          email: 'ana@cumpa.org',
          name: 'Ana',
          role: 'PARTICULAR',
          isEmailVerified: true,
          avatarUrl: null,
        },
      });
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        id: 'u1',
        email: 'ana@cumpa.org',
        name: 'Ana',
        role: 'PARTICULAR',
        isEmailVerified: true,
      });

      await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
      await waitFor(() => expect(screen.getByText('Home destino seguro')).toBeInTheDocument());
    });
  });

  describe('RegisterForm', () => {
    it('propagates selected INSTITUCION role to Google OAuth and completes institutional registration', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: 'http://localhost:5173/registro' },
      });

      vi.mocked(authService.register).mockResolvedValueOnce({
        message: 'Cuenta creada.',
        userId: 'u-inst-1',
      });

      render(
        <MemoryRouter initialEntries={['/registro']}>
          <AuthProvider>
            <Routes>
              <Route path="/registro" element={<RegisterForm />} />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Step 1: Select Refugio u ONG (INSTITUCION)
      const radios = screen.getAllByRole('radio');
      await user.click(radios[1]);
      await user.click(screen.getByRole('button', { name: /Continuar con Institución/i }));

      // Step 2: Google button carries ?role=INSTITUCION
      await user.click(screen.getByRole('button', { name: /Registrarse con Google/i }));
      expect(window.location.href).toBe(`${ENV.API_URL}/auth/google?role=INSTITUCION`);

      // Complete form traditionally
      await user.type(screen.getByLabelText(/Razón Social/i), 'Refugio San Roque');
      await user.type(screen.getByLabelText(/Correo Electrónico/i), 'sanroque@cumpa.org');
      await user.type(screen.getByLabelText(/^Contraseña/i), 'Segura123');
      await user.type(screen.getByLabelText(/Confirmar Clave/i), 'Segura123');
      await user.type(screen.getByLabelText(/Provincia/i), 'Santa Fe');
      await user.type(screen.getByLabelText(/Ciudad \/ Localidad/i), 'Rosario');

      await user.click(screen.getByRole('button', { name: /Completar Registro/i }));

      await waitFor(() =>
        expect(screen.getByText(/¡Cuenta creada con éxito!/i)).toBeInTheDocument()
      );
      expect(authService.register).toHaveBeenCalledWith({
        name: 'Refugio San Roque',
        email: 'sanroque@cumpa.org',
        password: 'Segura123',
        role: 'INSTITUCION',
        province: 'Santa Fe',
        city: 'Rosario',
        phone: undefined,
      });
    });
  });

  describe('OAuthSuccessPage', () => {
    it('stores token, refreshes user, and redirects to / on valid OAuth token', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        id: 'u-google',
        email: 'g@cumpa.org',
        name: 'Google User',
        role: 'INSTITUCION',
        isEmailVerified: true,
      });

      render(
        <MemoryRouter initialEntries={['/oauth-success?token=valid-oauth-jwt']}>
          <AuthProvider>
            <Routes>
              <Route path="/oauth-success" element={<OAuthSuccessPage />} />
              <Route path="/" element={<div>Dashboard Home</div>} />
              <Route path="/login" element={<div>Login Fallback</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('Dashboard Home')).toBeInTheDocument());
      expect(storage.getToken()).toBe('valid-oauth-jwt');
    });

    it('redirects to /login?error=oauth_failed when token is invalid and refreshUser clears it', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(authService.getMe).mockRejectedValueOnce(new Error('Token inválido'));

      render(
        <MemoryRouter initialEntries={['/oauth-success?token=bad-jwt']}>
          <AuthProvider>
            <Routes>
              <Route path="/oauth-success" element={<OAuthSuccessPage />} />
              <Route path="/" element={<div>Dashboard Home</div>} />
              <Route path="/login" element={<div>Login OAuth Error</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('Login OAuth Error')).toBeInTheDocument());
      expect(storage.getToken()).toBeNull();
      warnSpy.mockRestore();
    });
  });

  describe('VerifyEmailPage', () => {
    it('verifies token from query param and displays success state', async () => {
      vi.mocked(authService.verifyEmail).mockResolvedValueOnce({
        message: 'Cuenta verificada correctamente.',
        verified: true,
      });

      render(
        <MemoryRouter initialEntries={['/verificar-cuenta?token=verify-abc-123']}>
          <Routes>
            <Route path="/verificar-cuenta" element={<VerifyEmailPage />} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(screen.getByText(/¡Cuenta activada con éxito!/i)).toBeInTheDocument()
      );
      expect(authService.verifyEmail).toHaveBeenCalledWith('verify-abc-123');
    });

    it('shows error state when token is missing', async () => {
      render(
        <MemoryRouter initialEntries={['/verificar-cuenta']}>
          <Routes>
            <Route path="/verificar-cuenta" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(screen.getByText(/No pudimos activar tu cuenta/i)).toBeInTheDocument()
      );
      expect(authService.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('ForgotPasswordPage & ResetPasswordPage', () => {
    it('submits forgotPassword request and shows confirmation', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockResolvedValueOnce({
        message: 'Instrucciones enviadas a tu correo.',
      });

      render(
        <MemoryRouter initialEntries={['/recuperar-clave']}>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/i }));
      expect(screen.getByText(/El correo electrónico es obligatorio/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Correo Electrónico/i), 'ana@cumpa.org');
      await user.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/i }));

      await waitFor(() =>
        expect(screen.getByText(/¡Solicitud enviada!/i)).toBeInTheDocument()
      );
      expect(authService.forgotPassword).toHaveBeenCalledWith('ana@cumpa.org');
    });

    it('shows invalid link screen when ResetPasswordPage has no token, and resets password when token exists', async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <MemoryRouter initialEntries={['/restablecer-clave']}>
          <Routes>
            <Route path="/restablecer-clave" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(/Enlace incompleto o inválido/i)).toBeInTheDocument();
      unmount();

      vi.mocked(authService.resetPassword).mockResolvedValueOnce({
        message: 'Contraseña actualizada.',
      });

      render(
        <MemoryRouter initialEntries={['/restablecer-clave?token=reset-xyz-999']}>
          <Routes>
            <Route path="/restablecer-clave" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/^Nueva Contraseña/i), 'ClaveNueva1');
      await user.type(screen.getByLabelText(/Confirmar Nueva Contraseña/i), 'ClaveDistinta1');
      await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));
      expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();

      await user.clear(screen.getByLabelText(/Confirmar Nueva Contraseña/i));
      await user.type(screen.getByLabelText(/Confirmar Nueva Contraseña/i), 'ClaveNueva1');
      await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));

      await waitFor(() =>
        expect(screen.getByText(/¡Contraseña actualizada!/i)).toBeInTheDocument()
      );
      expect(authService.resetPassword).toHaveBeenCalledWith({
        token: 'reset-xyz-999',
        newPassword: 'ClaveNueva1',
      });
    });
  });
});

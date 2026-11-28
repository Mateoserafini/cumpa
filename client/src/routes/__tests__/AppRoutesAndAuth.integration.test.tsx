import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { authService } from '@/features/auth/services/authService';
import { adminService } from '@/features/admin/services/adminService';
import { storage } from '@/utils/storage';
import type { User } from '@/features/auth/types/auth.types';

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

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getStats: vi.fn(),
    getPendingInstitutions: vi.fn(),
    getReports: vi.fn(),
    verifyInstitution: vi.fn(),
    resolveReport: vi.fn(),
    createReport: vi.fn(),
  },
}));

const renderAt = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );

describe('AuthContext + AppRoutes + ProtectedRoute + RoleGuard integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects unauthenticated users from protected route /perfil to /login', async () => {
    renderAt('/perfil');
    await waitFor(() =>
      expect(screen.getByText(/Bienvenido a Cumpa/i)).toBeInTheDocument()
    );
  });

  it('redirects non-ADMIN authenticated users away from /admin to Home', async () => {
    storage.setToken('particular-jwt');
    const particularUser: User = {
      id: 'u1',
      email: 'juan@cumpa.org',
      name: 'Juan Pérez',
      role: 'PARTICULAR',
      isEmailVerified: true,
    };
    vi.mocked(authService.getMe).mockResolvedValueOnce(particularUser);

    renderAt('/admin');
    await waitFor(() =>
      expect(screen.getByText(/Encontrá a tu compañero/i)).toBeInTheDocument()
    );
  });

  it('allows ADMIN users into /admin/reportes and syncs Reports tab automatically', async () => {
    storage.setToken('admin-jwt');
    const adminUser: User = {
      id: 'u-admin',
      email: 'admin@cumpa.org',
      name: 'Admin Cumpa',
      role: 'ADMIN',
      isEmailVerified: true,
    };
    vi.mocked(authService.getMe).mockResolvedValueOnce(adminUser);
    vi.mocked(adminService.getStats).mockResolvedValueOnce({
      totalUsers: 50,
      totalActiveAnimals: 12,
      totalAdoptionsCompleted: 8,
      activeFollowUps: 5,
      complianceRatePercentage: 95,
    });
    vi.mocked(adminService.getPendingInstitutions).mockResolvedValueOnce([]);
    vi.mocked(adminService.getReports).mockResolvedValueOnce({
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 20,
      data: [],
    });

    renderAt('/admin/reportes');
    await waitFor(() =>
      expect(screen.getByText(/No hay denuncias pendientes de moderación/i)).toBeInTheDocument()
    );
  });

  it('logs out and redirects to /login when global cumpa:unauthorized event fires', async () => {
    storage.setToken('active-jwt');
    vi.mocked(authService.getMe).mockResolvedValueOnce({
      id: 'u1',
      email: 'juan@cumpa.org',
      name: 'Juan Pérez',
      role: 'PARTICULAR',
      isEmailVerified: true,
    });

    renderAt('/perfil');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Juan Pérez' })).toBeInTheDocument()
    );

    act(() => {
      window.dispatchEvent(new CustomEvent('cumpa:unauthorized'));
    });

    await waitFor(() =>
      expect(screen.getByText(/Bienvenido a Cumpa/i)).toBeInTheDocument()
    );
  });

  it('renders ProfilePage institutional statuses: hides button when PENDIENTE, shows notes & resubmit when RECHAZADA', async () => {
    storage.setToken('inst-jwt');
    vi.mocked(authService.getMe).mockResolvedValueOnce({
      id: 'u-inst',
      email: 'refugio@cumpa.org',
      name: 'Refugio Norte',
      role: 'INSTITUCION',
      isEmailVerified: true,
      institutionalProfile: {
        id: 'ip-1',
        userId: 'u-inst',
        legalName: 'Asociación Refugio Norte',
        cuit: '30-71234567-1',
        verificationStatus: 'PENDIENTE',
      },
    });

    const { unmount } = renderAt('/perfil');
    await waitFor(() => expect(screen.getByText(/En Revisión/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Documentación CUIT/i })).not.toBeInTheDocument();
    unmount();

    storage.setToken('inst-jwt-2');
    vi.mocked(authService.getMe).mockResolvedValueOnce({
      id: 'u-inst-2',
      email: 'refugio2@cumpa.org',
      name: 'Refugio Sur',
      role: 'INSTITUCION',
      isEmailVerified: true,
      institutionalProfile: {
        id: 'ip-2',
        userId: 'u-inst-2',
        legalName: 'Asociación Refugio Sur',
        cuit: '30-71234567-1',
        verificationStatus: 'RECHAZADA',
        verificationNotes: 'Falta constancia de CUIT legible.',
      },
    });

    renderAt('/perfil');
    await waitFor(() => expect(screen.getByText(/Rechazada/i)).toBeInTheDocument());
    expect(screen.getByText(/Falta constancia de CUIT legible/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reenviar Documentación CUIT/i })
    ).toBeInTheDocument();
  });

  it('redirects unknown routes to 404 page', async () => {
    renderAt('/ruta-inexistente-xyz');
    await waitFor(() =>
      expect(screen.getByText(/404 — Página no encontrada/i)).toBeInTheDocument()
    );
  });
});

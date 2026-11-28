import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProfilePage } from '@/pages/auth/ProfilePage';
import { authService } from '@/features/auth/services/authService';
import { usersService } from '@/features/auth/services/usersService';
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

vi.mock('@/features/auth/services/usersService', () => ({
  usersService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    submitInstitutionalVerification: vi.fn(),
    getInstitutionalStatus: vi.fn(),
  },
}));

const baseUser: User = {
  id: 'user-123',
  email: 'gonza@cumpa.org',
  name: 'Gonzalo Vega',
  role: 'PARTICULAR',
  phone: null,
  province: 'Buenos Aires',
  city: 'CABA',
  address: null,
  avatarUrl: null,
  isEmailVerified: true,
};

function renderProfile() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProfilePage — Edición de perfil (Happy, Wrong & Edge Cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    storage.setToken('valid-jwt-token');
  });

  it('[Happy] permite abrir el modal, agregar teléfono y dirección, guardar y refrescar el perfil', async () => {
    const user = userEvent.setup();
    const updatedUser: User = {
      ...baseUser,
      phone: '+54 11 5555-1234',
      address: 'Av. Corrientes 1234',
    };

    vi.mocked(authService.getMe)
      .mockResolvedValueOnce(baseUser)
      .mockResolvedValueOnce(updatedUser);
    vi.mocked(usersService.updateProfile).mockResolvedValueOnce({
      message: 'Perfil actualizado correctamente.',
      user: updatedUser,
    });

    renderProfile();

    const editBtn = await screen.findByRole('button', { name: /Editar Perfil/i });
    await user.click(editBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const phoneInput = screen.getByLabelText(/Teléfono de Contacto/i);
    const addressInput = screen.getByLabelText(/Dirección/i);

    await user.type(phoneInput, '+54 11 5555-1234');
    await user.type(addressInput, 'Av. Corrientes 1234');

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() => {
      expect(usersService.updateProfile).toHaveBeenCalledWith({
        name: 'Gonzalo Vega',
        phone: '+54 11 5555-1234',
        province: 'Buenos Aires',
        city: 'CABA',
        address: 'Av. Corrientes 1234',
        avatarUrl: null,
      });
    });

    expect(await screen.findByText(/Tus datos de perfil se actualizaron correctamente/i)).toBeInTheDocument();
    expect(await screen.findByText('+54 11 5555-1234')).toBeInTheDocument();
    expect(screen.getByText('Av. Corrientes 1234')).toBeInTheDocument();
  });

  it('[Wrong] valida teléfono corto y avatarUrl inseguro sin enviar petición al backend', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.getMe).mockResolvedValueOnce(baseUser);

    renderProfile();

    await user.click(await screen.findByRole('button', { name: /Editar Perfil/i }));

    await user.type(screen.getByLabelText(/Teléfono de Contacto/i), '123');
    await user.type(screen.getByLabelText(/URL de Foto de Perfil/i), 'javascript:alert(1)');

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    expect(await screen.findByText(/El teléfono debe tener entre 6 y 25 caracteres/i)).toBeInTheDocument();
    expect(
      screen.getByText(/La URL de la foto debe comenzar con http:\/\/ o https:\/\//i)
    ).toBeInTheDocument();
    expect(usersService.updateProfile).not.toHaveBeenCalled();
  });

  it('[Edge] permite borrar teléfono y dirección previos enviando null y muestra error si falla el API', async () => {
    const user = userEvent.setup();
    const userWithData: User = {
      ...baseUser,
      phone: '1144556677',
      address: 'Calle Falsa 123',
    };

    vi.mocked(authService.getMe).mockResolvedValueOnce(userWithData);
    vi.mocked(usersService.updateProfile).mockRejectedValueOnce(
      new Error('Error temporal del servidor')
    );

    renderProfile();

    await user.click(await screen.findByRole('button', { name: /Editar Perfil/i }));

    await user.clear(screen.getByLabelText(/Teléfono de Contacto/i));
    await user.clear(screen.getByLabelText(/Dirección/i));

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() => {
      expect(usersService.updateProfile).toHaveBeenCalledWith({
        name: 'Gonzalo Vega',
        phone: null,
        province: 'Buenos Aires',
        city: 'CABA',
        address: null,
        avatarUrl: null,
      });
    });

    expect(await screen.findByText('Error temporal del servidor')).toBeInTheDocument();
  });
});

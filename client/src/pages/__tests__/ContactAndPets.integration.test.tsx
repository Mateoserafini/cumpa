import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { ContactPage } from '@/pages/ContactPage';
import { PetDetailPage } from '@/pages/pets/PetDetailPage';
import { EditPetPage } from '@/pages/pets/EditPetPage';
import { MyPublicationsPage } from '@/pages/pets/MyPublicationsPage';
import { apiClient } from '@/services/apiClient';
import { petService } from '@/features/pets/services/petService';
import { adminService } from '@/features/admin/services/adminService';
import { adoptionService } from '@/features/adoptions/services/adoptionService';
import type { User } from '@/features/auth/types/auth.types';
import type { DetailedAnimal } from '@/features/pets/components/PetDetailHero';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/pets/services/petService', () => ({
  petService: {
    createAnimal: vi.fn(),
    getMyPublications: vi.fn(),
    updateAnimal: vi.fn(),
    updateStatus: vi.fn(),
    deleteAnimal: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    createReport: vi.fn(),
  },
}));

vi.mock('@/features/adoptions/services/adoptionService', () => ({
  adoptionService: {
    apply: vi.fn(),
  },
}));

const mockAnimal: DetailedAnimal = {
  id: 'animal-uuid-1',
  name: 'Milo',
  species: 'PERRO',
  breed: 'Mestizo',
  sex: 'MACHO',
  size: 'MEDIANO',
  ageCategory: 'JOVEN',
  approximateAgeMonths: 18,
  description: 'Milo es un perro muy amigable que adora jugar con chicos y pasear en el parque.',
  healthDetails: 'Vacuna antirrábica al día',
  isNeutered: true,
  isVaccinated: true,
  isDewormed: true,
  specialNeeds: false,
  specialNeedsDescription: null,
  modality: 'ADOPCION_DEFINITIVA',
  province: 'Córdoba',
  city: 'Córdoba',
  status: 'DISPONIBLE',
  images: [{ id: 'img1', url: 'https://cdn.example/milo.jpg', publicId: 'p1', isMain: true, order: 0 }],
  publisher: {
    id: 'pub-owner-1',
    name: 'Refugio Patitas',
    role: 'INSTITUCION',
    province: 'Córdoba',
    city: 'Córdoba',
    createdAt: '2025-01-01T00:00:00Z',
    institutionalProfile: {
      legalName: 'Asociación Civil Patitas',
      cuit: '30-71234567-1',
      verificationStatus: 'APROBADA',
      websiteUrl: 'https://patitas.org',
      instagramUrl: '@refugio_patitas',
    },
  },
};

const wrapWithAuth = (user: User | null, ui: React.ReactNode, initialEntries = ['/']) => {
  const ctx: AuthContextType = {
    user,
    token: user ? 'jwt-ok' : null,
    isAuthenticated: Boolean(user),
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={ctx}>{ui}</AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('ContactPage integration', () => {
  it('validates fields and displays confirmation screen after valid submission', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Enviar mensaje/i }));
    expect(screen.getByText(/Tu nombre es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/El correo electrónico es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/El mensaje es obligatorio/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Tu Nombre/i), 'María Gómez');
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'maria@cumpa.org');
    await user.type(
      screen.getByLabelText(/Mensaje/i),
      'Necesito ayuda para actualizar la documentación de mi refugio.'
    );
    await user.click(screen.getByRole('button', { name: /Enviar mensaje/i }));

    expect(screen.getByText(/¡Consulta registrada!/i)).toBeInTheDocument();
    expect(screen.getByText(/María Gómez/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Enviar otra consulta/i }));
    expect(screen.getByRole('button', { name: /Enviar mensaje/i })).toBeInTheDocument();
  });
});

describe('PetDetailPage + ReportModal + AdoptionModal integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows authenticated non-owner to report animal and submit adoption application with restricted modality', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockAnimal });
    vi.mocked(adminService.createReport).mockResolvedValueOnce({
      message: 'OK',
      reportId: 'rep-99',
    });
    vi.mocked(adoptionService.apply).mockResolvedValueOnce({
      message: 'Enviada',
      requestId: 'req-1',
      status: 'PENDIENTE',
    });

    const otherUser: User = {
      id: 'adopter-99',
      email: 'adopter@cumpa.org',
      name: 'Carlos',
      role: 'PARTICULAR',
      phone: '+5491155556666',
      isEmailVerified: true,
    };

    wrapWithAuth(
      otherUser,
      <Routes>
        <Route path="/mascotas/:id" element={<PetDetailPage />} />
      </Routes>,
      ['/mascotas/animal-uuid-1']
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument());

    // Open ReportModal and submit
    await user.click(screen.getByRole('button', { name: /Reportar/i }));
    await user.type(
      screen.getByLabelText(/Detalle de lo ocurrido/i),
      'Publicación sospechosa que requiere revisión de moderadores.'
    );
    await user.click(screen.getByRole('button', { name: /Enviar Denuncia/i }));
    await waitFor(() => expect(screen.getByText(/¡Denuncia registrada!/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Entendido/i }));

    // Open AdoptionModal -> modality select should be disabled because animal is ADOPCION_DEFINITIVA only
    await user.click(screen.getByRole('button', { name: /Postularme para Adoptar/i }));
    expect(screen.getByLabelText(/Modalidad Solicitada/i)).toBeDisabled();

    await user.type(
      screen.getByLabelText(/Mensaje y Motivación/i),
      'Tengo patio cerrado, tiempo disponible y experiencia previa con perros medianos.'
    );
    await user.click(screen.getByRole('button', { name: /Enviar Postulación/i }));
    await waitFor(() => expect(screen.getByText(/¡Postulación enviada!/i)).toBeInTheDocument());
    expect(adoptionService.apply).toHaveBeenCalledWith(
      expect.objectContaining({
        animalId: 'animal-uuid-1',
        type: 'ADOPCION_DEFINITIVA',
      })
    );
  });

  it('hides Report button when logged-in user is the publisher', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockAnimal });

    const ownerUser: User = {
      id: 'pub-owner-1',
      email: 'patitas@cumpa.org',
      name: 'Refugio Patitas',
      role: 'INSTITUCION',
      isEmailVerified: true,
    };

    wrapWithAuth(
      ownerUser,
      <Routes>
        <Route path="/mascotas/:id" element={<PetDetailPage />} />
      </Routes>,
      ['/mascotas/animal-uuid-1']
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Reportar/i })).not.toBeInTheDocument();
  });
});

describe('EditPetPage & MyPublicationsPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('EditPetPage blocks unauthorized user and allows owner to edit animal', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockAnimal });

    const stranger: User = {
      id: 'stranger-1',
      email: 'stranger@cumpa.org',
      name: 'Otro Usuario',
      role: 'PARTICULAR',
      isEmailVerified: true,
    };

    const { unmount } = wrapWithAuth(
      stranger,
      <Routes>
        <Route path="/mis-publicaciones/:id/editar" element={<EditPetPage />} />
      </Routes>,
      ['/mis-publicaciones/animal-uuid-1/editar']
    );

    await waitFor(() =>
      expect(screen.getByText(/No tienes permisos para editar esta publicación/i)).toBeInTheDocument()
    );
    unmount();

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockAnimal });
    const owner: User = {
      id: 'pub-owner-1',
      email: 'patitas@cumpa.org',
      name: 'Refugio Patitas',
      role: 'INSTITUCION',
      isEmailVerified: true,
    };

    wrapWithAuth(
      owner,
      <Routes>
        <Route path="/mis-publicaciones/:id/editar" element={<EditPetPage />} />
      </Routes>,
      ['/mis-publicaciones/animal-uuid-1/editar']
    );

    await waitFor(() =>
      expect(screen.getByText(/Editar Ficha de Milo/i)).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue('Milo')).toBeInTheDocument();
  });

  it('MyPublicationsPage renders EN_TRANSITO badge without status dropdown and updates DISPONIBLE status', async () => {
    const user = userEvent.setup();
    vi.mocked(petService.getMyPublications).mockResolvedValue([
      {
        ...mockAnimal,
        status: 'DISPONIBLE',
        pendingRequestsCount: 2,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        ...mockAnimal,
        id: 'animal-uuid-2',
        name: 'Toby',
        status: 'EN_TRANSITO',
        pendingRequestsCount: 0,
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ]);
    vi.mocked(petService.updateStatus).mockResolvedValueOnce({
      message: 'Actualizado',
      animal: {},
    });

    render(
      <MemoryRouter>
        <MyPublicationsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Milo')).toBeInTheDocument());
    expect(screen.getByText('En Tránsito')).toBeInTheDocument();

    // Only Milo (DISPONIBLE) has a status <select>; Toby (EN_TRANSITO) must not
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(1);

    await user.selectOptions(selects[0], 'PAUSADA');
    await waitFor(() =>
      expect(petService.updateStatus).toHaveBeenCalledWith('animal-uuid-1', 'PAUSADA')
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApplicationsInboxPage } from '@/pages/adoptions/ApplicationsInboxPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { TrackingPage } from '@/pages/tracking/TrackingPage';
import { adoptionService } from '@/features/adoptions/services/adoptionService';
import { petService } from '@/features/pets/services/petService';
import { adminService } from '@/features/admin/services/adminService';
import { trackingService } from '@/features/tracking/services/trackingService';

vi.mock('@/features/adoptions/services/adoptionService', () => ({
  adoptionService: {
    getMyApplications: vi.fn(),
    getApplicationsByAnimal: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/features/pets/services/petService', () => ({
  petService: {
    getMyPublications: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getStats: vi.fn(),
    getPendingInstitutions: vi.fn(),
    getReports: vi.fn(),
    verifyInstitution: vi.fn(),
    resolveReport: vi.fn(),
  },
}));

vi.mock('@/features/tracking/services/trackingService', () => ({
  trackingService: {
    getAsGuardian: vi.fn(),
    getAsAdopter: vi.fn(),
    reviewReport: vi.fn(),
  },
}));

describe('ApplicationsInboxPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Approve/Reject buttons ONLY on Received tab and hides them on Sent tab', async () => {
    const user = userEvent.setup();

    vi.mocked(petService.getMyPublications).mockResolvedValue([
      {
        id: 'pub-animal-1',
        name: 'Rocky',
        species: 'PERRO',
        sex: 'MACHO',
        size: 'GRANDE',
        ageCategory: 'ADULTO',
        description: 'Perro guardián muy noble y fiel.',
        isNeutered: true,
        isVaccinated: true,
        isDewormed: true,
        specialNeeds: false,
        modality: 'ADOPCION_DEFINITIVA',
        status: 'DISPONIBLE',
        province: 'Buenos Aires',
        city: 'Tandil',
        images: [],
        pendingRequestsCount: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    vi.mocked(adoptionService.getApplicationsByAnimal).mockResolvedValue([
      {
        id: 'req-received-1',
        animalId: 'pub-animal-1',
        applicantId: 'other-user-1',
        type: 'ADOPCION_DEFINITIVA',
        status: 'PENDIENTE',
        message: 'Tengo casa con parque grande para Rocky.',
        phone: '+5492494000111',
        hasOtherPets: false,
        hasYard: true,
        createdAt: '2026-01-05T00:00:00Z',
        applicant: { id: 'other-user-1', name: 'Sofía López', email: 'sofia@cumpa.org' },
      },
    ]);

    vi.mocked(adoptionService.getMyApplications).mockResolvedValue([
      {
        id: 'req-sent-1',
        animalId: 'other-animal-2',
        applicantId: 'me-1',
        type: 'ADOPCION_DEFINITIVA',
        status: 'PENDIENTE',
        message: 'Me encantaría adoptar a Nina.',
        phone: '+5491112345678',
        hasOtherPets: false,
        hasYard: true,
        createdAt: '2026-01-04T00:00:00Z',
        animal: { id: 'other-animal-2', name: 'Nina', species: 'GATO', status: 'DISPONIBLE' },
      },
    ]);

    vi.mocked(adoptionService.updateStatus).mockResolvedValueOnce({
      message: 'Aprobada',
      followUpCreated: true,
    });

    render(
      <MemoryRouter>
        <ApplicationsInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Postulación para Rocky/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Aprobar Adopción/i })).toBeInTheDocument();

    // Switch to Sent tab -> publisher actions MUST NOT appear
    await user.click(screen.getByRole('button', { name: /Enviadas por mí/i }));
    expect(screen.getByText(/Postulación para Nina/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aprobar Adopción/i })).not.toBeInTheDocument();

    // Switch back and approve received application
    await user.click(screen.getByRole('button', { name: /Recibidas en mis publicaciones/i }));
    await user.click(screen.getByRole('button', { name: /Aprobar Adopción/i }));
    await waitFor(() =>
      expect(adoptionService.updateStatus).toHaveBeenCalledWith('req-received-1', 'APROBADA')
    );
  });
});

describe('AdminDashboardPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aborts resolveReport when prompt is cancelled, validates min 10 chars, and hides actions on resolved reports', async () => {
    const user = userEvent.setup();

    vi.mocked(adminService.getStats).mockResolvedValue({
      totalUsers: 20,
      totalActiveAnimals: 5,
      totalAdoptionsCompleted: 3,
      activeFollowUps: 2,
      complianceRatePercentage: 100,
    });
    vi.mocked(adminService.getPendingInstitutions).mockResolvedValue([]);
    vi.mocked(adminService.getReports).mockResolvedValue({
      total: 2,
      totalPages: 1,
      page: 1,
      limit: 20,
      data: [
        {
          id: 'rep-pending',
          reporterId: 'u1',
          targetType: 'ANIMAL',
          targetId: '11111111-1111-1111-1111-111111111111',
          reason: 'ESTAFA',
          description: 'Solicitan transferencia bancaria previa.',
          status: 'PENDIENTE',
          createdAt: '2026-01-01T00:00:00Z',
          reporter: { id: 'u1', email: 'rep@cumpa.org', name: 'Denunciante', role: 'PARTICULAR' },
        },
        {
          id: 'rep-done',
          reporterId: 'u2',
          targetType: 'USER',
          targetId: '22222222-2222-2222-2222-222222222222',
          reason: 'SPAM',
          description: 'Cuenta de spam ya moderada anteriormente.',
          status: 'RESUELTO',
          createdAt: '2026-01-01T00:00:00Z',
          reporter: { id: 'u2', email: 'rep2@cumpa.org', name: 'Usuario 2', role: 'PARTICULAR' },
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/reportes']}>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Solicitan transferencia bancaria previa/i)).toBeInTheDocument()
    );

    // Only PENDIENTE report should have action buttons (1 Desestimar, 1 Sancionar y Resolver)
    expect(screen.getAllByRole('button', { name: /Desestimar/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Sancionar y Resolver/i })).toHaveLength(1);

    // Cancel prompt -> must NOT call resolveReport
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValueOnce(null);
    await user.click(screen.getByRole('button', { name: /Sancionar y Resolver/i }));
    expect(adminService.resolveReport).not.toHaveBeenCalled();

    // Too short notes (< 10 chars) -> shows validation alert, does NOT call API
    promptSpy.mockReturnValueOnce('corto');
    await user.click(screen.getByRole('button', { name: /Sancionar y Resolver/i }));
    expect(
      screen.getByText(/Las notas de resolución deben contener al menos 10 caracteres/i)
    ).toBeInTheDocument();
    expect(adminService.resolveReport).not.toHaveBeenCalled();

    // Valid notes -> calls resolveReport with DELETE_ANIMAL
    vi.mocked(adminService.resolveReport).mockResolvedValueOnce({
      message: 'OK',
      reportId: 'rep-pending',
      status: 'RESUELTO',
    });
    promptSpy.mockReturnValueOnce('Se eliminó la publicación fraudulenta tras verificar pruebas.');
    await user.click(screen.getByRole('button', { name: /Sancionar y Resolver/i }));
    await waitFor(() =>
      expect(adminService.resolveReport).toHaveBeenCalledWith('rep-pending', {
        status: 'RESUELTO',
        resolutionNotes: 'Se eliminó la publicación fraudulenta tras verificar pruebas.',
        takeAction: 'DELETE_ANIMAL',
      })
    );
    promptSpy.mockRestore();
  });
});

describe('TrackingPage + TrackingTimeline integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders INCUMPLIDO badge properly and lets guardian review completed report', async () => {
    const user = userEvent.setup();
    vi.mocked(trackingService.getAsGuardian).mockResolvedValue([
      {
        id: 'fu-1',
        animalId: 'a1',
        adopterId: 'u-adopter',
        guardianId: 'u-guardian',
        status: 'ALERTA_DISPARADA',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-07-01T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        animal: { id: 'a1', name: 'Milo', species: 'PERRO', mainImage: null },
        adopter: { id: 'u-adopter', name: 'Lucas', email: 'lucas@cumpa.org', phone: '123456' },
        reports: [
          {
            id: 'r-1',
            monthNumber: 1,
            dueDate: '2026-02-01T00:00:00Z',
            status: 'CUMPLIDO',
            submittedAt: '2026-01-30T00:00:00Z',
            notes: 'Adaptado perfecto.',
            reviewedByGuardian: false,
          },
          {
            id: 'r-2',
            monthNumber: 2,
            dueDate: '2026-03-01T00:00:00Z',
            status: 'INCUMPLIDO',
          },
        ],
      },
    ]);
    vi.mocked(trackingService.reviewReport).mockResolvedValueOnce({ message: 'OK' });

    render(
      <MemoryRouter>
        <TrackingPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Seguimiento de Milo/i)).toBeInTheDocument());
    expect(screen.getByText('Incumplido')).toBeInTheDocument();
    expect(screen.getByText(/La fecha límite ha vencido/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Dar Conformidad de Tutor/i }));
    await waitFor(() =>
      expect(trackingService.reviewReport).toHaveBeenCalledWith(
        'r-1',
        true,
        expect.any(String)
      )
    );
  });
});

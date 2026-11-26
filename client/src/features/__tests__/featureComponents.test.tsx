import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ReportModal } from '@/features/admin/components/ReportModal';
import { adminService } from '@/features/admin/services/adminService';
import { PetForm } from '@/features/pets/components/PetForm';
import { petService } from '@/features/pets/services/petService';
import { PublisherInfoCard } from '@/features/pets/components/PublisherInfoCard';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    createReport: vi.fn(),
  },
}));

vi.mock('@/features/pets/services/petService', () => ({
  petService: {
    createAnimal: vi.fn(),
    updateAnimal: vi.fn(),
  },
}));

describe('ReportModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ReportModal
        isOpen={false}
        onClose={vi.fn()}
        targetType="ANIMAL"
        targetId="uuid-1"
        targetLabel="Milo"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('validates minimum 15 characters and submits report successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(adminService.createReport).mockResolvedValueOnce({
      message: 'Denuncia radicada',
      reportId: 'rep-1',
    });

    render(
      <ReportModal
        isOpen
        onClose={vi.fn()}
        targetType="ANIMAL"
        targetId="uuid-animal-1"
        targetLabel="Milo"
      />
    );

    await user.type(screen.getByLabelText(/Detalle de lo ocurrido/i), 'Muy corto');
    await user.click(screen.getByRole('button', { name: /Enviar Denuncia/i }));

    expect(screen.getByText(/al menos 15 caracteres/i)).toBeInTheDocument();
    expect(adminService.createReport).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText(/Motivo/i), 'ESTAFA');
    await user.clear(screen.getByLabelText(/Detalle de lo ocurrido/i));
    await user.type(
      screen.getByLabelText(/Detalle de lo ocurrido/i),
      'Están pidiendo dinero por una adopción que debe ser gratuita.'
    );
    await user.click(screen.getByRole('button', { name: /Enviar Denuncia/i }));

    await waitFor(() =>
      expect(screen.getByText(/¡Denuncia registrada!/i)).toBeInTheDocument()
    );
    expect(adminService.createReport).toHaveBeenCalledWith({
      targetType: 'ANIMAL',
      targetId: 'uuid-animal-1',
      reason: 'ESTAFA',
      description: 'Están pidiendo dinero por una adopción que debe ser gratuita.',
    });
  });

  it('shows API error message when createReport rejects', async () => {
    const user = userEvent.setup();
    vi.mocked(adminService.createReport).mockRejectedValueOnce(
      new Error('No puedes denunciar tu propia publicación.')
    );

    render(
      <ReportModal
        isOpen
        onClose={vi.fn()}
        targetType="ANIMAL"
        targetId="uuid-animal-1"
        targetLabel="Milo"
      />
    );

    await user.type(
      screen.getByLabelText(/Detalle de lo ocurrido/i),
      'Descripción válida con más de quince caracteres.'
    );
    await user.click(screen.getByRole('button', { name: /Enviar Denuncia/i }));

    await waitFor(() =>
      expect(screen.getByText('No puedes denunciar tu propia publicación.')).toBeInTheDocument()
    );
  });
});

describe('PetForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields and image requirement in create mode', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PetForm mode="create" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Publicar Mascota/i }));

    expect(screen.getByText(/El nombre del animal es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/La descripción es obligatoria/i)).toBeInTheDocument();
    expect(screen.getByText(/Debe adjuntar al menos una fotografía/i)).toBeInTheDocument();
    expect(petService.createAnimal).not.toHaveBeenCalled();
  });

  it('submits updateAnimal in edit mode and sends explicit empty/null values when optional fields are cleared', async () => {
    const user = userEvent.setup();
    vi.mocked(petService.updateAnimal).mockResolvedValueOnce({
      message: 'Publicación actualizada',
      animal: {},
    });

    render(
      <MemoryRouter>
        <PetForm
          mode="edit"
          animalId="animal-123"
          initialData={{
            name: 'Luna',
            species: 'GATO',
            breed: 'Siamés',
            sex: 'HEMBRA',
            size: 'CHICO',
            ageCategory: 'ADULTO',
            approximateAgeMonths: 24,
            description: 'Gata muy cariñosa y tranquila, acostumbrada a vivir en departamento.',
            healthDetails: 'Vacuna triple felina al día',
            isNeutered: true,
            isVaccinated: true,
            isDewormed: true,
            specialNeeds: true,
            specialNeedsDescription: 'Dieta urinaria',
            modality: 'ADOPCION_DEFINITIVA',
            province: 'Buenos Aires',
            city: 'La Plata',
          }}
        />
      </MemoryRouter>
    );

    // Clear optional fields and uncheck specialNeeds
    await user.clear(screen.getByLabelText(/Raza \(Opcional\)/i));
    await user.clear(screen.getByLabelText(/Edad Estimada en Meses/i));
    await user.clear(screen.getByLabelText(/Observaciones de Salud/i));
    await user.click(screen.getByLabelText(/Necesidades Especiales/i));

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() =>
      expect(screen.getByText(/¡Publicación actualizada!/i)).toBeInTheDocument()
    );
    expect(petService.updateAnimal).toHaveBeenCalledWith(
      'animal-123',
      expect.objectContaining({
        name: 'Luna',
        breed: '',
        approximateAgeMonths: null,
        healthDetails: '',
        specialNeeds: false,
        specialNeedsDescription: '',
      })
    );
  });
});

describe('PublisherInfoCard security & formatting', () => {
  it('converts Instagram handle to https URL and strips javascript: XSS links', () => {
    render(
      <PublisherInfoCard
        publisher={{
          id: 'pub-1',
          name: 'Refugio Seguro',
          role: 'INSTITUCION',
          province: 'Córdoba',
          city: 'Córdoba',
          createdAt: '2025-06-01T00:00:00Z',
          institutionalProfile: {
            legalName: 'Asociación Refugio Seguro',
            cuit: '30-71234567-1',
            verificationStatus: 'APROBADA',
            websiteUrl: 'javascript:alert(1)',
            instagramUrl: '@refugio_seguro',
          },
        }}
      />
    );

    expect(screen.queryByRole('link', { name: /Sitio Web/i })).not.toBeInTheDocument();
    const igLink = screen.getByRole('link', { name: /Instagram/i });
    expect(igLink).toHaveAttribute('href', 'https://instagram.com/refugio_seguro');
  });
});

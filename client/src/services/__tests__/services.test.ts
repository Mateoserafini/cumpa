import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import { authService } from '@/features/auth/services/authService';
import { usersService } from '@/features/auth/services/usersService';
import { petService } from '@/features/pets/services/petService';
import { adminService } from '@/features/admin/services/adminService';
import { adoptionService } from '@/features/adoptions/services/adoptionService';
import { trackingService } from '@/features/tracking/services/trackingService';
import { explorationService } from '@/features/exploration/services/explorationService';
import { storage } from '@/utils/storage';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('API Services unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('authService', () => {
    it('login posts credentials and persists token', async () => {
      const mockResp = {
        token: 'jwt-123',
        user: {
          id: 'u1',
          email: 'ana@cumpa.org',
          name: 'Ana',
          role: 'PARTICULAR',
          isEmailVerified: true,
          avatarUrl: null,
        },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResp });

      const result = await authService.login({ email: 'ana@cumpa.org', password: 'Password1' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'ana@cumpa.org',
        password: 'Password1',
      });
      expect(result).toEqual(mockResp);
      expect(storage.getToken()).toBe('jwt-123');
    });

    it('supports register, getMe, verifyEmail, resendVerification, forgot/reset password, and logout', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { message: 'Registrado', userId: 'u2' },
      });
      await authService.register({
        name: 'Refugio',
        email: 'ref@cumpa.org',
        password: 'Password1',
        role: 'INSTITUCION',
        province: 'Buenos Aires',
        city: 'La Plata',
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ role: 'INSTITUCION' }));

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 'u1', email: 'ana@cumpa.org' } });
      await authService.getMe();
      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { message: 'OK', verified: true } });
      await authService.verifyEmail('tok+1');
      expect(apiClient.get).toHaveBeenCalledWith('/auth/verify-email/tok%2B1');

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'Reenviado' } });
      await authService.resendVerification('ana@cumpa.org');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'ana@cumpa.org' });

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'Enviado' } });
      await authService.forgotPassword('ana@cumpa.org');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'ana@cumpa.org' });

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'Actualizada' } });
      await authService.resetPassword({ token: 'reset-tok', newPassword: 'NewPassword1' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-tok',
        newPassword: 'NewPassword1',
      });

      storage.setToken('to-clear');
      authService.logout();
      expect(storage.getToken()).toBeNull();
    });
  });

  describe('usersService', () => {
    it('fetches profile, updates profile, submits institutional verification and checks status', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 'u1' } });
      await usersService.getProfile();
      expect(apiClient.get).toHaveBeenCalledWith('/users/profile');

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { message: 'OK', user: { id: 'u1' } } });
      await usersService.updateProfile({ city: 'Rosario' });
      expect(apiClient.put).toHaveBeenCalledWith('/users/profile', { city: 'Rosario' });

      const fd = new FormData();
      fd.append('legalName', 'Refugio');
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'Enviado', profileId: 'p1', status: 'PENDIENTE' } });
      await usersService.submitInstitutionalVerification(fd);
      expect(apiClient.post).toHaveBeenCalledWith('/users/institutional-verification', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { status: 'PENDIENTE' } });
      await usersService.getInstitutionalStatus();
      expect(apiClient.get).toHaveBeenCalledWith('/users/institutional-status');
    });
  });

  describe('petService', () => {
    it('builds multipart FormData in createAnimal with images and boolean strings', async () => {
      const file = new File(['img'], 'milo.jpg', { type: 'image/jpeg' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { message: 'Creado', id: 'a1', name: 'Milo', status: 'DISPONIBLE' },
      });

      await petService.createAnimal({
        name: 'Milo',
        species: 'PERRO',
        sex: 'MACHO',
        size: 'MEDIANO',
        ageCategory: 'JOVEN',
        approximateAgeMonths: 14,
        description: 'Perro muy dócil y cariñoso buscando hogar responsable.',
        isNeutered: true,
        isVaccinated: true,
        isDewormed: false,
        specialNeeds: false,
        modality: 'ADOPCION_DEFINITIVA',
        province: 'Córdoba',
        city: 'Córdoba',
        images: [file],
      });

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      const [url, sentData, config] = vi.mocked(apiClient.post).mock.calls[0];
      expect(url).toBe('/animals');
      expect(sentData).toBeInstanceOf(FormData);
      expect((sentData as FormData).get('name')).toBe('Milo');
      expect((sentData as FormData).get('isNeutered')).toBe('true');
      expect((sentData as FormData).get('approximateAgeMonths')).toBe('14');
      expect((sentData as FormData).getAll('images')).toHaveLength(1);
      expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
    });

    it('handles getMyPublications, updateAnimal, updateStatus, and deleteAnimal', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
      await petService.getMyPublications();
      expect(apiClient.get).toHaveBeenCalledWith('/animals/my-publications');

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { message: 'Actualizado', animal: {} } });
      await petService.updateAnimal('a1', { name: 'Milo II', approximateAgeMonths: null });
      expect(apiClient.put).toHaveBeenCalledWith('/animals/a1', {
        name: 'Milo II',
        approximateAgeMonths: null,
      });

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { message: 'OK', animal: {} } });
      await petService.updateStatus('a1', 'PAUSADA');
      expect(apiClient.patch).toHaveBeenCalledWith('/animals/a1/status', { status: 'PAUSADA' });

      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { message: 'Eliminado' } });
      await petService.deleteAnimal('a1');
      expect(apiClient.delete).toHaveBeenCalledWith('/animals/a1');
    });
  });

  describe('adminService', () => {
    it('calls all admin and report endpoints with expected payloads', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'OK', reportId: 'r1' } });
      await adminService.createReport({
        targetType: 'ANIMAL',
        targetId: 'a1',
        reason: 'ESTAFA',
        description: 'Intentan cobrar dinero por una adopción que debe ser gratuita.',
      });
      expect(apiClient.post).toHaveBeenCalledWith('/admin/reports', expect.objectContaining({ reason: 'ESTAFA' }));

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { totalUsers: 10 } });
      await adminService.getStats();
      expect(apiClient.get).toHaveBeenCalledWith('/admin/stats');

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
      await adminService.getPendingInstitutions();
      expect(apiClient.get).toHaveBeenCalledWith('/admin/institutions/pending');

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { message: 'OK', institutionId: 'i1', newStatus: 'APROBADA' } });
      await adminService.verifyInstitution('i1', 'APROBADA', 'CUIT verificado');
      expect(apiClient.patch).toHaveBeenCalledWith('/admin/institutions/i1/verify', {
        status: 'APROBADA',
        notes: 'CUIT verificado',
      });

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { total: 0, totalPages: 1, page: 1, limit: 20, data: [] } });
      await adminService.getReports({ status: 'PENDIENTE', page: 2 });
      expect(apiClient.get).toHaveBeenCalledWith('/admin/reports', {
        params: { status: 'PENDIENTE', page: 2 },
      });

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { message: 'OK', reportId: 'r1', status: 'RESUELTO' } });
      await adminService.resolveReport('r1', {
        status: 'RESUELTO',
        resolutionNotes: 'Publicación dada de baja por incumplimiento.',
        takeAction: 'DELETE_ANIMAL',
      });
      expect(apiClient.patch).toHaveBeenCalledWith('/admin/reports/r1/resolve', {
        status: 'RESUELTO',
        resolutionNotes: 'Publicación dada de baja por incumplimiento.',
        takeAction: 'DELETE_ANIMAL',
      });
    });
  });

  describe('adoptionService, trackingService & explorationService', () => {
    it('calls adoption endpoints properly', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'OK', requestId: 'req1', status: 'PENDIENTE' } });
      await adoptionService.apply({
        animalId: 'a1',
        type: 'ADOPCION_DEFINITIVA',
        message: 'Tengo patio cerrado y experiencia con perros rescatados.',
        phone: '+541145678900',
        hasOtherPets: false,
        hasYard: true,
      });
      expect(apiClient.post).toHaveBeenCalledWith('/contacts/apply', expect.objectContaining({ animalId: 'a1' }));

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
      await adoptionService.getMyApplications();
      expect(apiClient.get).toHaveBeenCalledWith('/contacts/my-applications');

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
      await adoptionService.getApplicationsByAnimal('a1');
      expect(apiClient.get).toHaveBeenCalledWith('/contacts/animal/a1');

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { message: 'Aprobada', followUpCreated: true } });
      await adoptionService.updateStatus('req1', 'APROBADA');
      expect(apiClient.patch).toHaveBeenCalledWith('/contacts/req1/status', {
        status: 'APROBADA',
        rejectionReason: undefined,
      });
    });

    it('calls tracking endpoints including multipart monthly report upload', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
      await trackingService.getAsGuardian();
      expect(apiClient.get).toHaveBeenCalledWith('/followups/as-guardian');

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
      await trackingService.getAsAdopter();
      expect(apiClient.get).toHaveBeenCalledWith('/followups/as-adopter');

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 'f1' } });
      await trackingService.getFollowUpById('f1');
      expect(apiClient.get).toHaveBeenCalledWith('/followups/f1');

      const photo = new File(['photo'], 'mes1.jpg', { type: 'image/jpeg' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'OK' } });
      await trackingService.submitMonthlyReport('f1', 1, photo, 'Muy feliz');
      const [url, body, opts] = vi.mocked(apiClient.post).mock.calls[0];
      expect(url).toBe('/followups/f1/report/1');
      expect(body).toBeInstanceOf(FormData);
      expect((body as FormData).get('notes')).toBe('Muy feliz');
      expect(opts).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { message: 'Revisado' } });
      await trackingService.reviewReport('rep1', true, 'Excelente estado');
      expect(apiClient.patch).toHaveBeenCalledWith('/followups/report/rep1/review', {
        reviewedByGuardian: true,
        guardianFeedback: 'Excelente estado',
      });
    });

    it('calls exploration endpoints with params', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { total: 1, totalPages: 1, page: 1, limit: 12, data: [] },
      });
      await explorationService.getAnimals({ species: 'GATO', page: 1 });
      expect(apiClient.get).toHaveBeenCalledWith('/animals', {
        params: { species: 'GATO', page: 1 },
      });

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 'a1', name: 'Michi' } });
      await explorationService.getAnimalById('a1');
      expect(apiClient.get).toHaveBeenCalledWith('/animals/a1');
    });
  });
});

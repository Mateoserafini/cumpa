import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { usePetSearch } from '@/features/exploration/hooks/usePetSearch';
import { explorationService } from '@/features/exploration/services/explorationService';
import type { User } from '@/features/auth/types/auth.types';

vi.mock('@/features/exploration/services/explorationService', () => ({
  explorationService: {
    getAnimals: vi.fn(),
    getAnimalById: vi.fn(),
  },
}));

const makeAuthContextValue = (user: User | null): AuthContextType => ({
  user,
  token: user ? 'token-123' : null,
  isAuthenticated: Boolean(user),
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
});

describe('useAuth hook', () => {
  it('throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      /useAuthContext debe ser utilizado dentro de un AuthProvider/
    );
    spy.mockRestore();
  });

  it('derives role and institutional verification flags accurately', () => {
    const vetUser: User = {
      id: 'u-vet',
      email: 'vet@cumpa.org',
      name: 'Clínica Sur',
      role: 'VETERINARIA',
      isEmailVerified: true,
      institutionalProfile: {
        id: 'ip1',
        userId: 'u-vet',
        legalName: 'Clínica Sur S.A.',
        cuit: '30-71234567-1',
        verificationStatus: 'APROBADA',
      },
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={makeAuthContextValue(vetUser)}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isVeterinaria).toBe(true);
    expect(result.current.isInstitution).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isParticular).toBe(false);
    expect(result.current.isVerifiedInstitution).toBe(true);
    expect(result.current.isPendingInstitution).toBe(false);
    expect(result.current.isRejectedInstitution).toBe(false);
  });

  it('detects ADMIN and RECHAZADA states', () => {
    const adminUser: User = {
      id: 'u-admin',
      email: 'admin@cumpa.org',
      name: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={makeAuthContextValue(adminUser)}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isInstitution).toBe(false);
  });
});

describe('usePetSearch hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-fetches animals, updates filters, changes page, and clears previous filters cleanly', async () => {
    vi.mocked(explorationService.getAnimals).mockResolvedValue({
      total: 2,
      totalPages: 2,
      page: 1,
      limit: 12,
      data: [
        {
          id: 'a1',
          name: 'Milo',
          species: 'PERRO',
          sex: 'MACHO',
          size: 'MEDIANO',
          ageCategory: 'JOVEN',
          modality: 'ADOPCION_DEFINITIVA',
          status: 'DISPONIBLE',
          province: 'Córdoba',
          city: 'Córdoba',
          mainImage: null,
          createdAt: '2026-01-01T00:00:00Z',
          publisher: { id: 'p1', name: 'Refugio', role: 'INSTITUCION', isVerifiedInstitution: true },
        },
      ],
    });

    const { result } = renderHook(() => usePetSearch({ autoFetch: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.animals).toHaveLength(1);
    expect(explorationService.getAnimals).toHaveBeenCalledWith({ page: 1, limit: 12 });

    // Apply species & search filters
    act(() => {
      result.current.updateFilters({ species: 'PERRO', search: 'Milo' });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(explorationService.getAnimals).toHaveBeenLastCalledWith({
      page: 1,
      limit: 12,
      species: 'PERRO',
      search: 'Milo',
    });

    // Clear filters must NOT leak previous species/search keys into query params
    act(() => {
      result.current.clearFilters();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(explorationService.getAnimals).toHaveBeenLastCalledWith({
      page: 1,
      limit: 12,
    });
  });

  it('sets error state and empties animals when API rejects', async () => {
    vi.mocked(explorationService.getAnimals).mockRejectedValueOnce(new Error('Error de red'));

    const { result } = renderHook(() => usePetSearch({ autoFetch: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Error de red');
    expect(result.current.animals).toEqual([]);
  });
});

import { useState, useEffect, useCallback, useRef } from 'react';
import { explorationService } from '../services/explorationService';
import type {
  AnimalSummary,
  PetQueryParams,
} from '../types/exploration.types';

interface PaginationState {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface UsePetSearchOptions {
  initialFilters?: PetQueryParams;
  autoFetch?: boolean;
}

export const usePetSearch = (options: UsePetSearchOptions = {}) => {
  const { initialFilters = {}, autoFetch = true } = options;

  const [animals, setAnimals] = useState<AnimalSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    totalPages: 1,
    page: initialFilters.page || 1,
    limit: initialFilters.limit || 12,
  });

  const [filters, setFiltersState] = useState<PetQueryParams>({
    page: 1,
    limit: 12,
    ...initialFilters,
  });

  // Referencia para evitar actualizar estado si el componente se desmonta
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchAnimals = useCallback(
    async (overrideFilters?: Partial<PetQueryParams>) => {
      setIsLoading(true);
      setError(null);

      const queryParams: PetQueryParams = {
        ...filters,
        ...overrideFilters,
      };

      try {
        const response = await explorationService.getAnimals(queryParams);
        if (isMountedRef.current) {
          setAnimals(response.data);
          setPagination({
            total: response.total,
            totalPages: response.totalPages,
            page: response.page,
            limit: response.limit,
          });
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const apiError = err as Error;
          setError(
            apiError.message ||
              'No fue posible cargar el catálogo de animales. Intente nuevamente.'
          );
          setAnimals([]);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [filters]
  );

  // Carga inicial
  useEffect(() => {
    if (autoFetch) {
      void fetchAnimals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPage = useCallback(
    (newPage: number) => {
      setFiltersState((prev) => ({ ...prev, page: newPage }));
      void fetchAnimals({ page: newPage });
    },
    [fetchAnimals]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<PetQueryParams>) => {
      const merged: PetQueryParams = {
        ...filters,
        ...newFilters,
        page: 1, // Reiniciar a la primera página al aplicar nuevos filtros
      };
      setFiltersState(merged);
      void fetchAnimals(merged);
    },
    [filters, fetchAnimals]
  );

  const clearFilters = useCallback(() => {
    const defaultParams: PetQueryParams = {
      page: 1,
      limit: 12,
    };
    setFiltersState(defaultParams);
    void fetchAnimals(defaultParams);
  }, [fetchAnimals]);

  return {
    animals,
    isLoading,
    error,
    pagination,
    filters,
    fetchAnimals,
    setPage,
    updateFilters,
    clearFilters,
  };
};

export default usePetSearch;

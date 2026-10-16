import React from 'react';
import { PetCard } from './PetCard';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Inbox, Sparkles } from 'lucide-react';
import type { AnimalSummary } from '../types/exploration.types';

interface PaginationProps {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface PetCatalogProps {
  animals: AnimalSummary[];
  isLoading: boolean;
  pagination: PaginationProps;
  onPageChange: (newPage: number) => void;
  onResetFilters?: () => void;
}

export const PetCatalog: React.FC<PetCatalogProps> = ({
  animals,
  isLoading,
  pagination,
  onPageChange,
  onResetFilters,
}) => {
  // Skeleton Loader mientras carga
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-soft animate-pulse flex flex-col justify-between"
            >
              <div className="aspect-4/3 w-full bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-28 bg-slate-200 rounded-md" />
                  <div className="h-4 w-12 bg-slate-200 rounded-md" />
                </div>
                <div className="h-3 w-40 bg-slate-200 rounded-md" />
                <div className="h-3 w-24 bg-slate-200 rounded-md" />
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-3 w-20 bg-slate-200 rounded-md" />
                  <div className="h-6 w-16 bg-slate-200 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Estado Vacío cuando no hay resultados
  if (animals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs my-8">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          No se encontraron mascotas
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Actualmente no hay publicaciones que coincidan con estos criterios de búsqueda o filtros seleccionados.
        </p>
        {onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onResetFilters}
            leftIcon={<Sparkles className="w-4 h-4 text-brand-600" />}
          >
            Limpiar filtros y ver todos
          </Button>
        )}
      </div>
    );
  }

  // Grilla de Mascotas y Controles de Paginación
  return (
    <div className="space-y-8">
      {/* Resumen de Resultados */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
        <span>
          Mostrando <strong className="text-slate-800">{animals.length}</strong> de{' '}
          <strong className="text-slate-800">{pagination.total}</strong> mascotas disponibles
        </span>
        <span>
          Página <strong className="text-slate-800">{pagination.page}</strong> de{' '}
          <strong className="text-slate-800">{pagination.totalPages}</strong>
        </span>
      </div>

      {/* Grilla Responsiva */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {animals.map((animal) => (
          <PetCard key={animal.id} animal={animal} />
        ))}
      </div>

      {/* Barra de Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Anterior
          </Button>

          {/* Números de página */}
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: pagination.totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              const isCurrent = pageNumber === pagination.page;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                    isCurrent
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
};

export default PetCatalog;

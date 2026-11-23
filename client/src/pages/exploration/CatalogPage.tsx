import React, { useState } from 'react';
import { usePetSearch } from '@/features/exploration/hooks/usePetSearch';
import { PetCatalog } from '@/features/exploration/components/PetCatalog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { Search, RotateCcw } from 'lucide-react';
import type { AnimalSpecies, AnimalModality } from '@/features/exploration/types/exploration.types';

export const CatalogPage: React.FC = () => {
  const {
    animals,
    isLoading,
    error,
    pagination,
    filters,
    setPage,
    updateFilters,
    clearFilters,
    fetchAnimals,
  } = usePetSearch({ autoFetch: true });

  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm.trim() || undefined });
  };

  const handleSpeciesChange = (species?: AnimalSpecies) => {
    updateFilters({ species });
  };

  const handleModalityChange = (modality?: AnimalModality) => {
    updateFilters({ modality });
  };

  const handleReset = () => {
    setSearchTerm('');
    clearFilters();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Encabezado del Catálogo */}
      <div className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider">
          🐾 Catálogo General
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explorar Mascotas en Adopción
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Conectate con animales rescatados por particulares y refugios verificados. Filtrá por especie, tamaño y modalidad de tránsito o adopción definitiva.
        </p>
      </div>

      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              id="search"
              name="search"
              type="text"
              placeholder="Buscar por nombre, raza o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Buscar
            </Button>
            {(filters.species || filters.modality || filters.search) && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                title="Limpiar filtros"
              >
                Limpiar
              </Button>
            )}
          </div>
        </form>

        {/* Filtros rápidos por especie y modalidad */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          {/* Especies */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Especie:
            </span>
            <button
              type="button"
              onClick={() => handleSpeciesChange(undefined)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                !filters.species
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleSpeciesChange('PERRO')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filters.species === 'PERRO'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🐶 Perros
            </button>
            <button
              type="button"
              onClick={() => handleSpeciesChange('GATO')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filters.species === 'GATO'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🐱 Gatos
            </button>
            <button
              type="button"
              onClick={() => handleSpeciesChange('OTRO')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filters.species === 'OTRO'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🐾 Otros
            </button>
          </div>

          {/* Modalidad */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Modalidad:
            </span>
            <button
              type="button"
              onClick={() => handleModalityChange(undefined)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                !filters.modality
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => handleModalityChange('ADOPCION_DEFINITIVA')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filters.modality === 'ADOPCION_DEFINITIVA'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Adopción Definitiva
            </button>
            <button
              type="button"
              onClick={() => handleModalityChange('TRANSITO_TEMPORARIO')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filters.modality === 'TRANSITO_TEMPORARIO'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hogar de Tránsito
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Error si la consulta falla */}
      {error && (
        <div className="mb-8">
          <Alert
            variant="error"
            title="Error al consultar el catálogo"
            onClose={() => fetchAnimals()}
          >
            {error}
          </Alert>
        </div>
      )}

      {/* Grilla del Catálogo */}
      <PetCatalog
        animals={animals}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onResetFilters={handleReset}
      />
    </div>
  );
};

export default CatalogPage;

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { PetForm } from '@/features/pets/components/PetForm';
import type { DetailedAnimal } from '@/features/pets/components/PetDetailHero';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';

export const EditPetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [animal, setAnimal] = useState<DetailedAnimal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchAnimal = async () => {
      if (!id) {
        setError('No se indicó un identificador de publicación válido.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<DetailedAnimal>(ENDPOINTS.ANIMALS.DETAIL(id));
        if (isCancelled) return;
        const data = response.data;
        if (user && data.publisher.id !== user.id && user.role !== 'ADMIN') {
          setError('No tienes permisos para editar esta publicación.');
        } else {
          setAnimal(data);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const apiError = err as Error;
        setError(apiError.message || 'No se pudo cargar la publicación para editar.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchAnimal();

    return () => {
      isCancelled = true;
    };
  }, [id, user?.id, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-3">
        <Spinner size="xl" variant="brand" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Cargando datos de la publicación...
        </p>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Alert variant="error" title="No disponible">
          {error || 'No se encontró la publicación solicitada.'}
        </Alert>
        <Link to="/mis-publicaciones">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver a Mis Publicaciones
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <Link
          to="/mis-publicaciones"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
          <span>Volver a Mis Publicaciones</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2 block w-fit">
          🐾 Edición de Publicación
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Editar Ficha de {animal.name}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Actualiza la información médica, ubicación o historia para mantener la ficha al día.
        </p>
      </div>

      <PetForm
        mode="edit"
        animalId={animal.id}
        initialData={{
          name: animal.name,
          species: animal.species,
          breed: animal.breed ?? undefined,
          sex: animal.sex,
          size: animal.size,
          ageCategory: animal.ageCategory,
          approximateAgeMonths: animal.approximateAgeMonths ?? undefined,
          description: animal.description,
          healthDetails: animal.healthDetails ?? undefined,
          isNeutered: animal.isNeutered,
          isVaccinated: animal.isVaccinated,
          isDewormed: animal.isDewormed,
          specialNeeds: animal.specialNeeds,
          specialNeedsDescription: animal.specialNeedsDescription ?? undefined,
          modality: animal.modality,
          province: animal.province,
          city: animal.city,
        }}
      />
    </div>
  );
};

export default EditPetPage;

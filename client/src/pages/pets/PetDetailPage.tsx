import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { PetDetailHero, type DetailedAnimal } from '@/features/pets/components/PetDetailHero';
import { PublisherInfoCard } from '@/features/pets/components/PublisherInfoCard';
import { AdoptionModal } from '@/features/adoptions/components/AdoptionModal';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Heart,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Stethoscope,
  Share2,
} from 'lucide-react';

export const PetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [animal, setAnimal] = useState<DetailedAnimal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchAnimal = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<DetailedAnimal>(
          ENDPOINTS.ANIMALS.DETAIL(id)
        );
        setAnimal(response.data);
      } catch (err: unknown) {
        const apiError = err as Error;
        setError(
          apiError.message ||
            'No se pudo encontrar la ficha de la mascota solicitada.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAnimal();
  }, [id]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-3">
        <Spinner size="xl" variant="brand" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Cargando ficha de la mascota...
        </p>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Alert variant="error" title="No encontrada">
          {error || 'No se encontró la publicación de la mascota o fue retirada.'}
        </Alert>
        <Link to="/explorar">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver al Catálogo de Mascotas
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Barra de Navegación Superior */}
      <div className="flex items-center justify-between">
        <Link
          to="/explorar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
          <span>Volver al catálogo</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? '¡Enlace copiado! ✔' : 'Compartir Ficha'}</span>
        </button>
      </div>

      {/* Hero Principal con Visor de Fotos */}
      <PetDetailHero
        animal={animal}
        onApplyClick={() => setIsModalOpen(true)}
      />

      {/* Grid de Contenido: Historia, Salud y Publicador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Historia y Ficha Veterinaria */}
        <div className="lg:col-span-7 space-y-8">
          {/* Historia y Descripción */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Sobre {animal.name}
              </h3>
            </div>

            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {animal.description}
            </div>
          </div>

          {/* Ficha Veterinaria y Sanitaria */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-soft space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Estado Sanitario y Cuidados Veterinarios
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                {animal.isNeutered ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-800 block">Castrado / Esterilizado</span>
                  <span className="text-slate-500">
                    {animal.isNeutered ? 'Intervención realizada' : 'Pendiente de castración'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                {animal.isVaccinated ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-800 block">Plan de Vacunación</span>
                  <span className="text-slate-500">
                    {animal.isVaccinated ? 'Vacunas al día' : 'Esquema incompleto'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                {animal.isDewormed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-800 block">Desparasitación</span>
                  <span className="text-slate-500">
                    {animal.isDewormed ? 'Tratamiento al día' : 'Sin desparasitar'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                {animal.specialNeeds ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-800 block">Necesidades Especiales</span>
                  <span className="text-slate-500">
                    {animal.specialNeeds ? 'Requiere atención específica' : 'Sin condiciones especiales'}
                  </span>
                </div>
              </div>
            </div>

            {animal.specialNeeds && animal.specialNeedsDescription && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold block mb-0.5">Cuidados especiales requeridos:</strong>
                {animal.specialNeedsDescription}
              </div>
            )}

            {animal.healthDetails && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <strong className="font-semibold block text-slate-800 mb-0.5">Observaciones médicas:</strong>
                {animal.healthDetails}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Tarjeta del Publicador */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <PublisherInfoCard publisher={animal.publisher} />
          </div>
        </div>
      </div>

      {/* Modal de Postulación */}
      <AdoptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        animalId={animal.id}
        animalName={animal.name}
        defaultModality={animal.modality}
        publisherId={animal.publisher.id}
      />
    </div>
  );
};

export default PetDetailPage;

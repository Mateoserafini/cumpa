import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { petService } from '@/features/pets/services/petService';
import type { MyPublicationItem } from '@/features/pets/types/pet.types';
import type { AnimalStatus } from '@/features/exploration/types/exploration.types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import {
  PawPrint,
  PlusCircle,
  Eye,
  Trash2,
  Inbox,
  CheckCircle2,
} from 'lucide-react';

export const MyPublicationsPage: React.FC = () => {
  const [publications, setPublications] = useState<MyPublicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPublications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await petService.getMyPublications();
      setPublications(data);
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'Error al obtener tus publicaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPublications();
  }, []);

  const handleStatusChange = async (id: string, newStatus: AnimalStatus) => {
    setProcessingId(id);
    setActionSuccess(null);
    try {
      await petService.updateStatus(id, newStatus);
      setActionSuccess(`Estado de la publicación actualizado a: ${newStatus}`);
      void fetchPublications();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'No fue posible actualizar el estado.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas dar de baja la publicación de ${name}?`)) {
      return;
    }
    setProcessingId(id);
    setActionSuccess(null);
    try {
      await petService.deleteAnimal(id);
      setActionSuccess(`La publicación de ${name} ha sido retirada.`);
      void fetchPublications();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'No fue posible eliminar la publicación.');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = (status: AnimalStatus) => {
    switch (status) {
      case 'DISPONIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Disponible
          </span>
        );
      case 'EN_PROCESO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            En Proceso
          </span>
        );
      case 'ADOPTADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            ¡Adoptado!
          </span>
        );
      case 'PAUSADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Pausada
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
            🐾 Gestión de Publicaciones
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Mis Animales Publicados
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Administra tus publicaciones, actualiza su disponibilidad o revisa las solicitudes recibidas.
          </p>
        </div>

        <Link to="/publicar">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Nueva Publicación
          </Button>
        </Link>
      </div>

      {actionSuccess && (
        <Alert variant="success" title="Acción completada" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 gap-3">
          <Spinner size="xl" variant="brand" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Cargando tus animales publicados...
          </p>
        </div>
      ) : publications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Aún no has publicado mascotas
          </h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Publica un animal rescatado o en tránsito para ayudarle a encontrar un hogar responsable.
          </p>
          <Link to="/publicar">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Publicar una Mascota Ahora
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publications.map((animal) => {
            const mainImg = animal.images.find((img) => img.isMain)?.url || animal.images[0]?.url;

            return (
              <div
                key={animal.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {mainImg ? (
                    <img
                      src={mainImg}
                      alt={animal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <PawPrint className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">{statusBadge(animal.status)}</div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {animal.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {animal.species} • {animal.sex} • {animal.city}, {animal.province}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {animal.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/mascotas/${animal.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver ficha
                    </Link>

                    <Link
                      to="/solicitudes"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                    >
                      <Inbox className="w-3.5 h-3.5" /> Solicitudes ({animal.pendingRequestsCount || 0})
                    </Link>

                    <button
                      type="button"
                      disabled={processingId === animal.id}
                      onClick={() => handleDelete(animal.id, animal.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {animal.status !== 'ADOPTADO' && (
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Cambiar estado:</span>
                      <select
                        value={animal.status}
                        disabled={processingId === animal.id}
                        onChange={(e) =>
                          handleStatusChange(animal.id, e.target.value as AnimalStatus)
                        }
                        className="text-xs rounded-lg border border-slate-200 py-1 px-2 text-slate-700 bg-slate-50 focus:bg-white"
                      >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="EN_PROCESO">En Proceso</option>
                        <option value="PAUSADA">Pausada</option>
                        <option value="CANCELADA">Cancelada</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPublicationsPage;

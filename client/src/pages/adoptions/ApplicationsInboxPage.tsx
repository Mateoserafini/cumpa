import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adoptionService } from '@/features/adoptions/services/adoptionService';
import { petService } from '@/features/pets/services/petService';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import {
  Inbox,
  Phone,
  Home,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import type { AdoptionRequestItem } from '@/features/adoptions/types/adoption.types';

export const ApplicationsInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');
  const [receivedApplications, setReceivedApplications] = useState<AdoptionRequestItem[]>([]);
  const [sentApplications, setSentApplications] = useState<AdoptionRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sent, myPublications] = await Promise.all([
        adoptionService.getMyApplications(),
        petService.getMyPublications(),
      ]);

      setSentApplications(sent);

      if (myPublications.length > 0) {
        const perAnimalLists = await Promise.all(
          myPublications.map(async (animal) => {
            const apps = await adoptionService.getApplicationsByAnimal(animal.id);
            const mainImage =
              animal.images.find((img) => img.isMain)?.url || animal.images[0]?.url || null;
            return apps.map((app) => ({
              ...app,
              animal: app.animal ?? {
                id: animal.id,
                name: animal.name,
                species: animal.species,
                mainImage,
                status: animal.status,
              },
            }));
          })
        );
        const merged = perAnimalLists
          .flat()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReceivedApplications(merged);
      } else {
        setReceivedApplications([]);
      }
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(
        apiError.message || 'No fue posible cargar la bandeja de postulaciones.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const handleUpdateStatus = async (
    id: string,
    status: 'APROBADA' | 'RECHAZADA'
  ) => {
    setProcessingId(id);
    setActionSuccess(null);
    try {
      await adoptionService.updateStatus(id, status);
      setActionSuccess(
        status === 'APROBADA'
          ? '¡Postulación aprobada! El animal pasó a estado Adoptado y se inició el seguimiento de 6 meses.'
          : 'La postulación ha sido desestimada.'
      );
      void fetchApplications();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'Error al actualizar el estado de la postulación.');
    } finally {
      setProcessingId(null);
    }
  };

  const applications = activeTab === 'RECEIVED' ? receivedApplications : sentApplications;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Encabezado */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
          🐾 Gestión de Adopciones
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Bandeja de Solicitudes y Postulaciones
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Revisa las postulaciones enviadas y recibidas, evalúa las condiciones del hogar y formaliza adopciones responsables.
        </p>
      </div>

      {actionSuccess && (
        <Alert variant="success" title="Acción completada" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error en solicitudes" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Selector de Pestañas: Recibidas vs Enviadas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('RECEIVED')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'RECEIVED'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Recibidas en mis publicaciones ({receivedApplications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SENT')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'SENT'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          Enviadas por mí ({sentApplications.length})
        </button>
      </div>

      {/* Estados de Carga o Vacío */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 gap-3">
          <Spinner size="xl" variant="brand" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Consultando solicitudes de adopción...
          </p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {activeTab === 'RECEIVED'
              ? 'No tienes solicitudes recibidas'
              : 'No tienes postulaciones enviadas'}
          </h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {activeTab === 'RECEIVED'
              ? 'Cuando otros usuarios se postulen a tus mascotas publicadas, podrás evaluarlas y aprobarlas desde aquí.'
              : 'Cuando te postules para una mascota en el catálogo, podrás seguir el estado de tu solicitud aquí.'}
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/explorar')}>
            Explorar Animales Disponibles
          </Button>
        </div>
      ) : (
        /* Listado de Solicitudes */
        <div className="space-y-4">
          {applications.map((app) => {
            const isPending = app.status === 'PENDIENTE';
            const isApproved = app.status === 'APROBADA';
            const isRejected = app.status === 'RECHAZADA';

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4 hover:border-slate-200 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center text-xl font-bold overflow-hidden shadow-xs shrink-0">
                      {app.animal?.mainImage ? (
                        <img
                          src={app.animal.mainImage}
                          alt={app.animal.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        '🐾'
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Postulación para {app.animal?.name || 'Mascota'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Modalidad:{' '}
                        <strong className="text-slate-700">
                          {app.type === 'ADOPCION_DEFINITIVA'
                            ? 'Adopción Definitiva'
                            : 'Hogar de Tránsito'}
                        </strong>{' '}
                        &bull; Fecha: {new Date(app.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>

                  {/* Estado de la Solicitud */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isRejected
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Detalles de la postulación */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block font-semibold">Contacto del Postulante</span>
                    <span className="font-bold text-slate-800 text-sm block">
                      {app.applicant?.name || 'Adoptante'}
                    </span>
                    <span className="text-slate-600 flex items-center gap-1.5 pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {app.phone}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block font-semibold">Ambiente y Vivienda</span>
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      Vivienda: {app.housingType || 'Casa'}
                    </span>
                    <span className="text-slate-700 block">
                      {app.hasYard ? 'Cuenta con patio cerrado ✔' : 'Sin patio / balcón'}
                    </span>
                    <span className="text-slate-700 block">
                      {app.hasOtherPets ? 'Convive con otras mascotas ✔' : 'Único animal en el hogar'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 md:col-span-1">
                    <span className="text-slate-400 block font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-600" /> Mensaje y Motivación
                    </span>
                    <p className="text-slate-700 italic leading-relaxed line-clamp-3">
                      "{app.message}"
                    </p>
                  </div>
                </div>

                {/* Acciones para el Publicador solo en postulaciones recibidas pendientes */}
                {activeTab === 'RECEIVED' &&
                  (isPending || app.status === 'EN_REVISION') && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(app.id, 'RECHAZADA')}
                      disabled={processingId === app.id}
                      leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                    >
                      Desestimar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(app.id, 'APROBADA')}
                      disabled={processingId === app.id}
                      isLoading={processingId === app.id}
                      leftIcon={<CheckCircle className="w-4 h-4 text-white" />}
                    >
                      Aprobar Adopción y Crear Seguimiento
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationsInboxPage;

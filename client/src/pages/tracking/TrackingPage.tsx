import React, { useState, useEffect } from 'react';
import { trackingService } from '@/features/tracking/services/trackingService';
import { TrackingTimeline } from '@/features/tracking/components/TrackingTimeline';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { CalendarCheck } from 'lucide-react';
import type { FollowUpItem } from '@/features/tracking/types/tracking.types';

export const TrackingPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuardianFollowUps = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await trackingService.getAsGuardian();
      setFollowUps(data);
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(
        apiError.message ||
          'No fue posible obtener los casos de seguimiento post-adopción.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchGuardianFollowUps();
  }, []);

  const totalActive = followUps.filter((f) => f.status === 'ACTIVO').length;
  const totalCompleted = followUps.filter((f) => f.status === 'COMPLETADO').length;
  const totalAlerts = followUps.filter(
    (f) => f.status === 'EN_MORA' || f.status === 'ALERTA_DISPARADA'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
            🐾 Auditoría de Bienestar Animal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Seguimientos Post-Adopción (Como Tutor)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Supervisa los 6 reportes fotográficos mensuales de los animales que entregaste en adopción.
          </p>
        </div>

        {/* Tarjetas KPI Rápido */}
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Activos
            </span>
            <span className="text-lg font-bold text-emerald-600">{totalActive}</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Completados
            </span>
            <span className="text-lg font-bold text-purple-600">{totalCompleted}</span>
          </div>
          {totalAlerts > 0 && (
            <div className="px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs text-center">
              <span className="text-[11px] font-semibold text-rose-500 block uppercase">
                En Mora
              </span>
              <span className="text-lg font-bold text-rose-700">{totalAlerts}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error de conexión" onClose={() => fetchGuardianFollowUps()}>
          {error}
        </Alert>
      )}

      {/* Estados de Carga o Vacío */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 gap-3">
          <Spinner size="xl" variant="brand" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Consultando expedientes de seguimiento en curso...
          </p>
        </div>
      ) : followUps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No tienes expedientes de seguimiento
          </h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Cuando apruebes una postulación de adopción en la bandeja de solicitudes, se creará automáticamente el expediente de seguimiento de 6 meses aquí.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => (window.location.href = '/solicitudes')}
          >
            Ir a Bandeja de Solicitudes
          </Button>
        </div>
      ) : (
        /* Lista de Expedientes con Timeline */
        <div className="space-y-8">
          {followUps.map((followUp) => (
            <TrackingTimeline key={followUp.id} followUp={followUp} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackingPage;

import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import type { FollowUpItem, FollowUpReport } from '../types/tracking.types';

interface TrackingTimelineProps {
  followUp: FollowUpItem;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ followUp }) => {
  const getStatusBadge = (status: FollowUpReport['status']) => {
    switch (status) {
      case 'CUMPLIDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Cumplido
          </span>
        );
      case 'ATRASADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" /> En Mora
          </span>
        );
      case 'PENDIENTE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-soft space-y-6">
      {/* Encabezado del Expediente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold overflow-hidden shadow-xs shrink-0">
            {followUp.animal.mainImage ? (
              <img
                src={followUp.animal.mainImage}
                alt={followUp.animal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              '🐾'
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Seguimiento de {followUp.animal.name}
            </h3>
            <p className="text-xs text-slate-500">
              Adoptante: <strong className="text-slate-700">{followUp.adopter.name}</strong> &bull; Tel:{' '}
              {followUp.adopter.phone || 'No provisto'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Estado del Caso:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              followUp.status === 'COMPLETADO'
                ? 'bg-purple-100 text-purple-800'
                : followUp.status === 'ACTIVO'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {followUp.status}
          </span>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO INTERACTIVA DE LOS 6 MESES */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {followUp.reports.map((report) => {
          const isCompleted = report.status === 'CUMPLIDO';
          const isOverdue = report.status === 'ATRASADO';

          const formattedDueDate = new Date(report.dueDate).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });

          return (
            <div key={report.id || report.monthNumber} className="relative group">
              {/* Nodo Circular en la Línea */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isOverdue
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="text-[10px] font-bold">{report.monthNumber}</span>
                )}
              </div>

              {/* Tarjeta del Reporte */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      Mes {report.monthNumber} de 6
                    </h4>
                    {getStatusBadge(report.status)}
                  </div>

                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Límite: {formattedDueDate}
                  </span>
                </div>

                {/* Si el reporte fue presentado */}
                {isCompleted && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                    {/* Foto enviada por el adoptante */}
                    {report.imageUrl && (
                      <div className="sm:col-span-4 aspect-4/3 rounded-xl overflow-hidden bg-slate-200 shadow-xs border border-slate-200">
                        <img
                          src={report.imageUrl}
                          alt={`Reporte fotográfico mes ${report.monthNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Comentarios del adoptante y revisión */}
                    <div className="sm:col-span-8 space-y-2 text-xs">
                      {report.notes && (
                        <div className="p-3 rounded-xl bg-white border border-slate-100 text-slate-700 leading-relaxed">
                          <span className="font-semibold block text-slate-800 mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-brand-600" /> Notas del Adoptante:
                          </span>
                          "{report.notes}"
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Camera className="w-3.5 h-3.5" />
                        <span>
                          Enviado el:{' '}
                          {report.submittedAt
                            ? new Date(report.submittedAt).toLocaleDateString('es-AR')
                            : 'Fecha no registrada'}
                        </span>
                      </div>

                      {report.reviewedByGuardian && (
                        <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Auditado y Aprobado por el Tutor</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingTimeline;

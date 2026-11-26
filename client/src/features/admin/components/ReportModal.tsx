import React, { useState } from 'react';
import { Flag, X, CheckCircle2, Send } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { ReportReason, ReportTargetType } from '../types/admin.types';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'DATOS_FALSOS', label: 'Datos o fotos falsas / engañosas' },
  { value: 'MALTRATO', label: 'Sospecha de maltrato o descuido animal' },
  { value: 'ESTAFA', label: 'Intento de venta o estafa económica' },
  { value: 'SPAM', label: 'Spam o contenido ajeno a la adopción' },
  { value: 'OTRO', label: 'Otro motivo' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}) => {
  const [reason, setReason] = useState<ReportReason>('DATOS_FALSOS');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    setIsSuccess(false);
    setDescription('');
    setReason('DATOS_FALSOS');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < 15) {
      setError('Por favor detalla el motivo de la denuncia con al menos 15 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await adminService.createReport({
        targetType,
        targetId,
        reason,
        description: trimmed,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'No fue posible enviar la denuncia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <Flag className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Moderación Comunitaria
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">
          Reportar {targetType === 'ANIMAL' ? 'Publicación' : 'Usuario'}
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Estás reportando a <strong className="text-slate-700">{targetLabel}</strong>. Un administrador revisará tu denuncia de forma confidencial.
        </p>

        {isSuccess ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">¡Denuncia registrada!</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gracias por ayudarnos a mantener Cumpa seguro. El equipo de moderación revisará el caso a la brevedad.
            </p>
            <Button variant="primary" size="md" onClick={handleClose}>
              Entendido
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4">
                <Alert variant="error" title="Error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="report-reason"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Motivo <span className="text-rose-500">*</span>
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                >
                  {REPORT_REASONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="report-description"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Detalle de lo ocurrido <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="report-description"
                  rows={4}
                  placeholder="Describe brevemente qué detectaste (mínimo 15 caracteres)..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  maxLength={2000}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition"
                />
                <div className="flex justify-end text-[11px] text-slate-400">
                  <span>{description.trim().length} / 2000 caracteres (mín. 15)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                  className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
                >
                  Enviar Denuncia
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

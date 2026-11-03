import React, { useState } from 'react';
import { trackingService } from '../services/trackingService';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { Camera, X, UploadCloud, CheckCircle2 } from 'lucide-react';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUpId: string;
  monthNumber: number;
  animalName: string;
  onSuccess: () => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  onClose,
  followUpId,
  monthNumber,
  animalName,
  onSuccess,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar los 5MB.');
        return;
      }
      setImageFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Debes adjuntar una fotografía actual del animal.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await trackingService.submitMonthlyReport(
        followUpId,
        monthNumber,
        imageFile,
        notes.trim() || undefined
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'Error al subir el reporte mensual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Seguimiento Mes {monthNumber}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">
          Cargar Reporte Fotográfico de {animalName}
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Sube una foto reciente donde se observe el estado de salud y bienestar del animal adoptado.
        </p>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error en la carga" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selector de Foto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Fotografía Obligatoria (JPG / PNG / WebP, máx 5MB) *
            </label>

            {imagePreview ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img
                  src={imagePreview}
                  alt="Vista previa del reporte"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:bg-brand-50/20 transition cursor-pointer">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-700">
                  Haz clic para seleccionar una foto
                </span>
                <span className="text-xs text-slate-400 mt-1">Formatos permitidos: JPG, PNG o WebP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Notas y comentarios */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Comentarios sobre su adaptación y bienestar (Opcional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Cómo se encuentra? ¿Realizó alguna visita al veterinario o vacuna?"
              className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirmar y Entregar Reporte
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReportModal;


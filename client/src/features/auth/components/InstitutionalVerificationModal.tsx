import React, { useState } from 'react';
import { usersService } from '../services/usersService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';
import { Building2, X, CheckCircle2 } from 'lucide-react';

interface InstitutionalVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InstitutionalVerificationModal: React.FC<InstitutionalVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [legalName, setLegalName] = useState('');
  const [cuit, setCuit] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim()) {
      setError('La razón social es obligatoria.');
      return;
    }
    if (!cuit.trim()) {
      setError('El CUIT es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('legalName', legalName.trim());
    formData.append('cuit', cuit.trim());
    if (websiteUrl.trim()) formData.append('websiteUrl', websiteUrl.trim());
    if (instagramUrl.trim()) formData.append('instagramUrl', instagramUrl.trim());
    if (documentFile) formData.append('documentFile', documentFile);

    try {
      await usersService.submitInstitutionalVerification(formData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'Error al enviar la solicitud de personería.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Personería Jurídica
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">
          Solicitud de Verificación Institucional
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Ingresa los datos fiscales oficiales de tu ONG, refugio o veterinaria para habilitar la publicación de animales.
        </p>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="legalName"
            name="legalName"
            type="text"
            label="Razón Social o Nombre Legal Completo *"
            placeholder="Asociación Civil Rescate Animal"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            required
          />

          <Input
            id="cuit"
            name="cuit"
            type="text"
            label="CUIT Fiscal (11 dígitos, con o sin guiones) *"
            placeholder="30-71234567-1"
            value={cuit}
            onChange={(e) => setCuit(e.target.value)}
            required
          />

          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            label="Sitio Web Oficial (Opcional)"
            placeholder="https://refugio.org"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />

          <Input
            id="instagramUrl"
            name="instagramUrl"
            type="text"
            label="Perfil de Instagram (Opcional)"
            placeholder="@refugio_oficial"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Constancia de CUIT o Estatuto (PDF o Imagen, máx 5MB)
            </label>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
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
              Enviar a Auditoría
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstitutionalVerificationModal;

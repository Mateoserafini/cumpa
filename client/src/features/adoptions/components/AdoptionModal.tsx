import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { adoptionService } from '../services/adoptionService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';
import {
  X,
  Heart,
  Phone,
  Home,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { AnimalModality } from '@/features/exploration/types/exploration.types';
import type { SubmitApplicationPayload } from '../types/adoption.types';

interface AdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  animalId: string;
  animalName: string;
  defaultModality: AnimalModality;
  publisherId: string;
}

export const AdoptionModal: React.FC<AdoptionModalProps> = ({
  isOpen,
  onClose,
  animalId,
  animalName,
  defaultModality,
  publisherId,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    type: (defaultModality === 'TRANSITO_TEMPORARIO'
      ? 'TRANSITO_TEMPORARIO'
      : 'ADOPCION_DEFINITIVA') as 'ADOPCION_DEFINITIVA' | 'TRANSITO_TEMPORARIO',
    phone: user?.phone || '',
    address: user?.address || '',
    housingType: 'CASA',
    hasYard: true,
    hasOtherPets: false,
    landlordAllowsPets: true,
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isOwner = user?.id === publisherId;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono de contacto es obligatorio';
    } else if (formData.phone.trim().length < 6 || formData.phone.trim().length > 30) {
      errors.phone = 'Ingrese un teléfono de contacto válido (6 a 30 caracteres)';
    }

    if (!formData.message.trim()) {
      errors.message = 'Por favor cuéntale al rescatista sobre ti y las condiciones de tu hogar';
    } else if (formData.message.trim().length < 20) {
      errors.message = 'El mensaje debe tener al menos 20 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: SubmitApplicationPayload = {
      animalId,
      type: formData.type,
      message: formData.message.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim() || undefined,
      hasOtherPets: formData.hasOtherPets,
      hasYard: formData.hasYard,
      housingType: formData.housingType,
      landlordAllowsPets: formData.landlordAllowsPets,
    };

    try {
      await adoptionService.apply(payload);
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || 'No fue posible registrar la postulación. Intente nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden my-8">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-brand-600 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Postularme para {animalName}
              </h3>
              <p className="text-xs text-slate-500">
                Formulario de tenencia responsable
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DEL MODAL */}
        <div className="p-6">
          {/* Caso 1: Usuario NO autenticado */}
          {!isAuthenticated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Inicia sesión para postularte
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Para garantizar un proceso de adopción seguro y formal, debes acceder con tu cuenta de Cumpa.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="md" onClick={onClose}>
                  Cancelar
                </Button>
                <Link to="/login" state={{ from: location }}>
                  <Button variant="primary" size="md">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          ) : isOwner ? (
            /* Caso 2: El usuario es el dueño de la publicación */
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Esta publicación te pertenece
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No puedes enviar una postulación de adopción para un animal publicado por ti mismo.
              </p>
              <Button variant="primary" size="md" onClick={onClose} className="mt-2">
                Entendido
              </Button>
            </div>
          ) : isSuccess ? (
            /* Caso 3: Postulación enviada exitosamente */
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                ¡Postulación enviada!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                El tutor responsable de <strong className="text-slate-800">{animalName}</strong> ha recibido
                tu solicitud. Se contactará contigo por teléfono o email para coordinar la entrevista.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  onClose();
                  navigate('/solicitudes');
                }}
              >
                Ver Mis Solicitudes
              </Button>
            </div>
          ) : (
            /* Caso 4: Formulario interactivo */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMessage && (
                <Alert
                  variant="error"
                  title="No se pudo enviar la solicitud"
                  onClose={() => setErrorMessage(null)}
                >
                  {errorMessage}
                </Alert>
              )}

              {/* Selector de Modalidad */}
              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="type"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Modalidad Solicitada
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                >
                  <option value="ADOPCION_DEFINITIVA">Adopción Definitiva 🏡</option>
                  <option value="TRANSITO_TEMPORARIO">Hogar de Tránsito Temporario ⏳</option>
                </select>
              </div>

              {/* Teléfono de Contacto */}
              <Input
                id="phone"
                name="phone"
                type="tel"
                label="Teléfono de Contacto Directo"
                placeholder="+54 11 1234-5678"
                value={formData.phone}
                onChange={handleChange}
                error={fieldErrors.phone}
                disabled={isSubmitting}
                required
                leftIcon={<Phone className="w-4 h-4" />}
              />

              {/* Ambiente Hogareño */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1.5 text-left">
                  <label
                    htmlFor="housingType"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Tipo de Vivienda
                  </label>
                  <select
                    id="housingType"
                    name="housingType"
                    value={formData.housingType}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option value="CASA">Casa</option>
                    <option value="DEPARTAMENTO">Departamento</option>
                    <option value="PH">PH / Otro</option>
                  </select>
                </div>

                <Input
                  id="address"
                  name="address"
                  type="text"
                  label="Barrio / Dirección Aprox."
                  placeholder="Ej: Barrio Norte"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  leftIcon={<Home className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Preguntas de Tenencia Responsable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none text-xs text-slate-800">
                  <input
                    type="checkbox"
                    name="hasYard"
                    checked={formData.hasYard}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                  />
                  <span>Tengo patio o parque cerrado</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none text-xs text-slate-800">
                  <input
                    type="checkbox"
                    name="hasOtherPets"
                    checked={formData.hasOtherPets}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                  />
                  <span>Convivo con otras mascotas</span>
                </label>
              </div>

              {/* Mensaje de Motivación */}
              <div className="flex flex-col gap-1.5 text-left pt-1">
                <label
                  htmlFor="message"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Mensaje y Motivación <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="Cuéntale al tutor por qué deseas adoptarlo/a, tu experiencia previa y cómo es tu rutina..."
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 transition ${
                    fieldErrors.message
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-brand-500'
                  }`}
                />
                {fieldErrors.message && (
                  <p className="text-[11px] font-medium text-rose-600">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {/* Botones de Envío */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="px-6 font-bold"
                >
                  Enviar Postulación
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdoptionModal;

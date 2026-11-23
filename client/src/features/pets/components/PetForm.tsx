import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { petService } from '../services/petService';
import { CloudinaryUploader } from './CloudinaryUploader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import {
  PawPrint,
  Heart,
  MapPin,
  Stethoscope,
  Camera,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type {
  AnimalSpecies,
  AnimalSex,
  AnimalSize,
  AnimalAgeCategory,
  AnimalModality,
} from '@/features/exploration/types/exploration.types';
import type { CreateAnimalPayload } from '../types/pet.types';

export const PetForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    name: string;
    species: AnimalSpecies;
    breed: string;
    sex: AnimalSex;
    size: AnimalSize;
    ageCategory: AnimalAgeCategory;
    approximateAgeMonths: string;
    description: string;
    healthDetails: string;
    isNeutered: boolean;
    isVaccinated: boolean;
    isDewormed: boolean;
    specialNeeds: boolean;
    specialNeedsDescription: string;
    modality: AnimalModality;
    province: string;
    city: string;
  }>({
    name: '',
    species: 'PERRO',
    breed: '',
    sex: 'MACHO',
    size: 'MEDIANO',
    ageCategory: 'JOVEN',
    approximateAgeMonths: '',
    description: '',
    healthDetails: '',
    isNeutered: false,
    isVaccinated: false,
    isDewormed: false,
    specialNeeds: false,
    specialNeedsDescription: '',
    modality: 'ADOPCION_DEFINITIVA',
    province: '',
    city: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre del animal es obligatorio';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 60) {
      errors.name = 'El nombre debe tener entre 2 y 60 caracteres';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    } else if (formData.description.trim().length < 20) {
      errors.description = 'La descripción debe tener al menos 20 caracteres para contar su historia';
    }

    if (!formData.province.trim()) {
      errors.province = 'La provincia es obligatoria';
    }

    if (!formData.city.trim()) {
      errors.city = 'La localidad o ciudad es obligatoria';
    }

    if (formData.approximateAgeMonths && Number(formData.approximateAgeMonths) <= 0) {
      errors.approximateAgeMonths = 'Ingrese una edad válida en meses';
    }

    if (formData.specialNeeds && !formData.specialNeedsDescription.trim()) {
      errors.specialNeedsDescription = 'Por favor detalle la necesidad o condición especial';
    }

    if (images.length === 0) {
      errors.images = 'Debe adjuntar al menos una fotografía de la mascota';
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

    const payload: CreateAnimalPayload = {
      name: formData.name.trim(),
      species: formData.species,
      breed: formData.breed.trim() || undefined,
      sex: formData.sex,
      size: formData.size,
      ageCategory: formData.ageCategory,
      approximateAgeMonths: formData.approximateAgeMonths
        ? Number(formData.approximateAgeMonths)
        : undefined,
      description: formData.description.trim(),
      healthDetails: formData.healthDetails.trim() || undefined,
      isNeutered: formData.isNeutered,
      isVaccinated: formData.isVaccinated,
      isDewormed: formData.isDewormed,
      specialNeeds: formData.specialNeeds,
      specialNeedsDescription: formData.specialNeeds
        ? formData.specialNeedsDescription.trim()
        : undefined,
      modality: formData.modality,
      province: formData.province.trim(),
      city: formData.city.trim(),
      images,
    };

    try {
      await petService.createAnimal(payload);
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || 'No fue posible crear la publicación. Verifique los datos ingresados.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto border border-slate-100 shadow-card animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          ¡Publicación creada exitosamente!
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          <strong className="text-slate-800">{formData.name}</strong> ya forma parte del catálogo de adopción.
          Las familias interesadas podrán enviarte postulaciones de tenencia responsable.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/explorar')}
          >
            Ver en el Catálogo
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/mis-publicaciones')}
          >
            Mis Publicaciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Alerta de Error */}
      {errorMessage && (
        <Alert
          variant="error"
          title="Error al publicar mascota"
          onClose={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      {/* SECCIÓN 1: FOTOGRAFÍAS */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Fotografías de la Mascota
            </h3>
            <p className="text-xs text-slate-500">
              Sube fotos claras con buena iluminación para acelerar su adopción.
            </p>
          </div>
        </div>

        <CloudinaryUploader
          images={images}
          onChange={(newImages) => {
            setImages(newImages);
            if (fieldErrors.images) {
              setFieldErrors((prev) => ({ ...prev, images: '' }));
            }
          }}
          maxFiles={5}
          disabled={isSubmitting}
          error={fieldErrors.images}
        />
      </div>

      {/* SECCIÓN 2: DATOS BÁSICOS */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-warm-100 text-warm-700 flex items-center justify-center">
            <PawPrint className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Datos Principales y Rasgos Físicos
            </h3>
            <p className="text-xs text-slate-500">
              Identificación y características corporales según el registro de Prisma.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <Input
            id="name"
            name="name"
            label="Nombre del Animal"
            placeholder="Ej: Milo, Luna, Rocky"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            disabled={isSubmitting}
            required
          />

          {/* Especie */}
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="species"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Especie <span className="text-rose-500">*</span>
            </label>
            <select
              id="species"
              name="species"
              value={formData.species}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
            >
              <option value="PERRO">Perro 🐶</option>
              <option value="GATO">Gato 🐱</option>
              <option value="OTRO">Otro 🐾</option>
            </select>
          </div>

          <Input
            id="breed"
            name="breed"
            label="Raza (Opcional)"
            placeholder="Ej: Mestizo, Labrador, Siamés"
            value={formData.breed}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          {/* Sexo */}
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="sex"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Sexo <span className="text-rose-500">*</span>
            </label>
            <select
              id="sex"
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
            >
              <option value="MACHO">Macho</option>
              <option value="HEMBRA">Hembra</option>
            </select>
          </div>

          {/* Tamaño */}
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="size"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Tamaño Estimado <span className="text-rose-500">*</span>
            </label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
            >
              <option value="CHICO">Chico (hasta 10 kg)</option>
              <option value="MEDIANO">Mediano (10 a 25 kg)</option>
              <option value="GRANDE">Grande (+25 kg)</option>
            </select>
          </div>

          {/* Categoría de Edad */}
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="ageCategory"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Categoría de Edad <span className="text-rose-500">*</span>
            </label>
            <select
              id="ageCategory"
              name="ageCategory"
              value={formData.ageCategory}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
            >
              <option value="CACHORRO">Cachorro (0 a 1 año)</option>
              <option value="JOVEN">Joven (1 a 3 años)</option>
              <option value="ADULTO">Adulto (3 a 8 años)</option>
              <option value="SENIOR">Senior (+8 años)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="approximateAgeMonths"
            name="approximateAgeMonths"
            type="number"
            min={1}
            max={360}
            label="Edad Estimada en Meses (Opcional)"
            placeholder="Ej: 14 (1 año y 2 meses)"
            value={formData.approximateAgeMonths}
            onChange={handleChange}
            error={fieldErrors.approximateAgeMonths}
            disabled={isSubmitting}
          />

          {/* Modalidad */}
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="modality"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Modalidad de Publicación <span className="text-rose-500">*</span>
            </label>
            <select
              id="modality"
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
            >
              <option value="ADOPCION_DEFINITIVA">Adopción Definitiva</option>
              <option value="TRANSITO_TEMPORARIO">Hogar de Tránsito Temporario</option>
              <option value="AMBAS">Ambas (Adopción o Tránsito)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: UBICACIÓN GEOGRÁFICA */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Ubicación Actual</h3>
            <p className="text-xs text-slate-500">
              Donde reside actualmente el animal para coordinar visitas o entrega responsable.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="province"
            name="province"
            label="Provincia"
            placeholder="Ej: Córdoba, Buenos Aires, Santa Fe"
            value={formData.province}
            onChange={handleChange}
            error={fieldErrors.province}
            disabled={isSubmitting}
            required
          />

          <Input
            id="city"
            name="city"
            label="Localidad / Ciudad"
            placeholder="Ej: Villa Carlos Paz, Rosario, Tandil"
            value={formData.city}
            onChange={handleChange}
            error={fieldErrors.city}
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      {/* SECCIÓN 4: HISTORIA Y PERSONALIDAD */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Historia y Personalidad
            </h3>
            <p className="text-xs text-slate-500">
              Describe su temperamento, cómo se lleva con niños u otros animales y su historia de rescate.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label
            htmlFor="description"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Descripción Detallada <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Cuenta cómo es en el día a día, nivel de energía, si sabe pasear con correa, etc. (mínimo 20 caracteres)..."
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 transition ${
              fieldErrors.description
                ? 'border-rose-400 focus:border-rose-500'
                : 'border-slate-300 focus:border-brand-500'
            }`}
          />
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>{fieldErrors.description && <span className="text-rose-600 font-medium">{fieldErrors.description}</span>}</span>
            <span>{formData.description.length} / 2000 caracteres</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5: SALUD Y CUIDADOS ESPECIALES */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ficha Veterinaria y Estado Sanitario
            </h3>
            <p className="text-xs text-slate-500">
              Información médica indispensable para la tenencia responsable.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition">
            <input
              type="checkbox"
              name="isNeutered"
              checked={formData.isNeutered}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">Castrado / Esterilizado</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition">
            <input
              type="checkbox"
              name="isVaccinated"
              checked={formData.isVaccinated}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">Vacunación al Día</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition">
            <input
              type="checkbox"
              name="isDewormed"
              checked={formData.isDewormed}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">Desparasitado/a</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition">
            <input
              type="checkbox"
              name="specialNeeds"
              checked={formData.specialNeeds}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">Necesidades Especiales</span>
          </label>
        </div>

        {formData.specialNeeds && (
          <Input
            id="specialNeedsDescription"
            name="specialNeedsDescription"
            label="Detalle de la Necesidad Especial"
            placeholder="Ej: Requiere medicación diaria, dieta hepática, movilidad reducida..."
            value={formData.specialNeedsDescription}
            onChange={handleChange}
            error={fieldErrors.specialNeedsDescription}
            disabled={isSubmitting}
            required
          />
        )}

        <Input
          id="healthDetails"
          name="healthDetails"
          label="Observaciones de Salud Adicionales (Opcional)"
          placeholder="Ej: Libre de VIF/ViLeF, control cardiológico anual realizado..."
          value={formData.healthDetails}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      {/* BOTÓN DE ENVÍO */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="shadow-md shadow-brand-600/20 font-semibold px-8"
        >
          Publicar Mascota
        </Button>
      </div>
    </form>
  );
};

export default PetForm;

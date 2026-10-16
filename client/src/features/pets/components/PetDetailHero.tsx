import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MapPin, Heart, Sparkles } from 'lucide-react';
import type { AnimalImage } from '../types/pet.types';
import type {
  AnimalSpecies,
  AnimalSex,
  AnimalSize,
  AnimalAgeCategory,
  AnimalModality,
  AnimalStatus,
} from '@/features/exploration/types/exploration.types';

export interface DetailedAnimal {
  id: string;
  name: string;
  species: AnimalSpecies;
  breed?: string | null;
  sex: AnimalSex;
  size: AnimalSize;
  ageCategory: AnimalAgeCategory;
  approximateAgeMonths?: number | null;
  description: string;
  healthDetails?: string | null;
  isNeutered: boolean;
  isVaccinated: boolean;
  isDewormed: boolean;
  specialNeeds: boolean;
  specialNeedsDescription?: string | null;
  modality: AnimalModality;
  province: string;
  city: string;
  status: AnimalStatus;
  images: AnimalImage[];
  publisher: {
    id: string;
    name: string;
    role: string;
    province: string;
    city: string;
    avatarUrl?: string | null;
    createdAt: string;
    institutionalProfile?: {
      legalName: string;
      cuit: string;
      verificationStatus: string;
      websiteUrl?: string | null;
      instagramUrl?: string | null;
    } | null;
  };
}

interface PetDetailHeroProps {
  animal: DetailedAnimal;
  onApplyClick: () => void;
  canApply?: boolean;
}

export const PetDetailHero: React.FC<PetDetailHeroProps> = ({
  animal,
  onApplyClick,
  canApply = true,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const currentImage = animal.images[selectedPhotoIndex]?.url;

  const speciesConfig = {
    PERRO: { text: 'Perro', emoji: '🐶' },
    GATO: { text: 'Gato', emoji: '🐱' },
    OTRO: { text: 'Otro', emoji: '🐾' },
  }[animal.species] || { text: 'Mascota', emoji: '🐾' };

  const modalityText = {
    ADOPCION_DEFINITIVA: 'Adopción Definitiva',
    TRANSITO_TEMPORARIO: 'Hogar de Tránsito',
    AMBAS: 'Adopción o Tránsito',
  }[animal.modality];

  const isAvailable = animal.status === 'DISPONIBLE';
  const isPending = animal.status === 'EN_PROCESO';

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* COLUMNA IZQUIERDA: VISOR DE FOTOS */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-100">
          {/* Foto Principal */}
          <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-200 shadow-inner">
            {currentImage ? (
              <img
                src={currentImage}
                alt={animal.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <span className="text-6xl mb-2">{speciesConfig.emoji}</span>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Sin fotografía
                </span>
              </div>
            )}

            {/* Badges superiores */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
                {modalityText}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-xs ${
                  isAvailable
                    ? 'bg-emerald-600/90 text-white'
                    : isPending
                    ? 'bg-amber-500/90 text-white'
                    : 'bg-slate-700/90 text-white'
                }`}
              >
                {isAvailable ? 'Disponible' : isPending ? 'En Proceso' : animal.status}
              </span>
            </div>
          </div>

          {/* Carrusel de Miniaturas */}
          {animal.images.length > 1 && (
            <div className="flex items-center gap-2.5 mt-4 overflow-x-auto pb-1">
              {animal.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                    selectedPhotoIndex === idx
                      ? 'border-brand-600 ring-2 ring-brand-500/30 scale-105'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN DESTACADA Y LLAMADO A LA ACCIÓN */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> En busca de familia
            </div>

            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {animal.name}
              </h1>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 uppercase">
                {animal.sex === 'MACHO' ? 'Macho' : 'Hembra'}
              </span>
            </div>

            <p className="text-sm text-slate-500 font-medium">
              {animal.breed || `${speciesConfig.text} mestizo`}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {animal.city}, {animal.province}
              </span>
            </div>

            {/* Matriz de Ficha Técnica Rápida */}
            <div className="grid grid-cols-2 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Tamaño</span>
                <span className="font-bold text-slate-800">{animal.size}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Categoría</span>
                <span className="font-bold text-slate-800">{animal.ageCategory}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Edad Aproximada</span>
                <span className="font-bold text-slate-800">
                  {animal.approximateAgeMonths
                    ? `${animal.approximateAgeMonths} meses`
                    : 'No especificada'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Especie</span>
                <span className="font-bold text-slate-800">
                  {speciesConfig.text} {speciesConfig.emoji}
                </span>
              </div>
            </div>
          </div>

          {/* CTA POSTULARSE */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full text-base font-bold shadow-md shadow-brand-600/20 py-3.5"
              onClick={onApplyClick}
              disabled={(!isAvailable && !isPending) || !canApply}
              leftIcon={<Heart className="w-5 h-5 fill-white text-white" />}
            >
              Postularme para {animal.modality === 'TRANSITO_TEMPORARIO' ? 'Tránsito' : 'Adoptar'}
            </Button>
            <p className="text-[11px] text-center text-slate-400">
              * La postulación iniciará un contacto directo con el tutor y requiere completar el cuestionario de tenencia responsable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetailHero;

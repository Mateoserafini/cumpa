import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import type { AnimalSummary } from '../types/exploration.types';

interface PetCardProps {
  animal: AnimalSummary;
}

export const PetCard: React.FC<PetCardProps> = ({ animal }) => {
  const [imageError, setImageError] = useState(false);

  // Especie a texto e icono amigable
  const speciesLabel = {
    PERRO: { text: 'Perro', emoji: '🐶' },
    GATO: { text: 'Gato', emoji: '🐱' },
    OTRO: { text: 'Otro', emoji: '🐾' },
  }[animal.species] || { text: 'Mascota', emoji: '🐾' };

  // Formato de categoría de edad
  const ageLabel = {
    CACHORRO: 'Cachorro',
    JOVEN: 'Joven',
    ADULTO: 'Adulto',
    SENIOR: 'Senior',
  }[animal.ageCategory] || animal.ageCategory;

  // Formato de tamaño
  const sizeLabel = {
    CHICO: 'Tamaño Chico',
    MEDIANO: 'Tamaño Mediano',
    GRANDE: 'Tamaño Grande',
  }[animal.size] || animal.size;

  // Modalidad
  const modalityLabel = {
    ADOPCION_DEFINITIVA: 'Adopción Definitiva',
    TRANSITO_TEMPORARIO: 'Hogar de Tránsito',
    AMBAS: 'Adopción o Tránsito',
  }[animal.modality] || 'Adopción';

  // Badge de Estado
  const isAvailable = animal.status === 'DISPONIBLE';

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      {/* Contenedor de Imagen y Badges Flotantes */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
        {animal.mainImage && !imageError ? (
          <img
            src={animal.mainImage}
            alt={animal.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-brand-50 to-warm-100/50 text-slate-400">
            <span className="text-5xl select-none mb-1">{speciesLabel.emoji}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {speciesLabel.text}
            </span>
          </div>
        )}

        {/* Badges superiores sobre la foto */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          {/* Badge de Modalidad */}
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
            {modalityLabel}
          </span>

          {/* Badge de Estado */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-xs ${
              isAvailable
                ? 'bg-emerald-600/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}
          >
            {isAvailable ? 'Disponible' : 'En Proceso'}
          </span>
        </div>
      </div>

      {/* Contenido / Datos de la Mascota */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Nombre y Especie */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-700 transition leading-tight">
              {animal.name}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {animal.sex === 'MACHO' ? 'Macho' : 'Hembra'}
            </span>
          </div>

          {/* Raza o características */}
          <p className="text-xs text-slate-500 mb-3 font-medium">
            {animal.breed ? animal.breed : `${speciesLabel.text} mestizo`} &bull; {ageLabel} &bull; {sizeLabel}
          </p>

          {/* Ubicación */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {animal.city}, {animal.province}
            </span>
          </div>
        </div>

        {/* Footer de la Tarjeta: Publicador y Botón de Acción */}
        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate max-w-[160px]">
            <span className="truncate font-medium">{animal.publisher.name}</span>
            {animal.publisher.isVerifiedInstitution && (
              <span title="Institución Verificada">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </span>
            )}
          </div>

          <Link
            to={`/mascotas/${animal.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 group-hover:text-brand-800 transition py-1 px-2.5 rounded-lg hover:bg-brand-50"
          >
            <span>Conocer</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PetCard;

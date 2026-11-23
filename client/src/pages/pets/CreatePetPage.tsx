import React from 'react';
import { Link } from 'react-router-dom';
import { PetForm } from '@/features/pets/components/PetForm';
import { ArrowLeft, Info, HeartHandshake } from 'lucide-react';

export const CreatePetPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Navegación y Encabezado */}
      <div className="mb-8 space-y-4">
        <Link
          to="/explorar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
          <span>Volver al catálogo</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
              🐾 Nueva Publicación
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Publicar Mascota en Adopción o Tránsito
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Completa los datos de la ficha para iniciar el proceso de búsqueda responsable.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 p-3 rounded-2xl bg-brand-50 text-brand-800 border border-brand-100 text-xs max-w-xs">
            <HeartHandshake className="w-8 h-8 text-brand-600 shrink-0" />
            <span>Compromiso ético: Todas las publicaciones pasan por moderación comunitaria.</span>
          </div>
        </div>
      </div>

      {/* Banner de Consejos */}
      <div className="mb-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Recomendación para rescatistas:</strong> Las publicaciones con
          fotografías nítidas, donde se describa sinceramente el nivel de energía y la compatibilidad con otros
          animales, concretan adopciones duraderas con un 80% menos de devoluciones.
        </div>
      </div>

      {/* Formulario Principal */}
      <PetForm />
    </div>
  );
};

export default CreatePetPage;

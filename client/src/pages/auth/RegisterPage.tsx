import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, Stethoscope, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 shadow-inner">
        <span className="text-2xl" role="img" aria-label="Patita Cumpa">🐾</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
        Únete a Cumpa
      </h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Selecciona el tipo de cuenta que mejor se adapte a tu actividad
      </p>

      <div className="space-y-4 text-left">
        <div className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 transition cursor-pointer flex items-start gap-3.5 group">
          <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 group-hover:text-brand-700 transition">
              Adoptante / Particular
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Busco adoptar un animal de compañía o dar en adopción responsable como rescatista independiente.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition self-center" />
        </div>

        <div className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 transition cursor-pointer flex items-start gap-3.5 group">
          <div className="w-10 h-10 rounded-lg bg-warm-100 text-warm-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 group-hover:text-brand-700 transition">
              Refugio u ONG Institucional
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Represento a una entidad protectora con personería jurídica, CUIT y múltiples animales a cargo.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition self-center" />
        </div>

        <div className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 transition cursor-pointer flex items-start gap-3.5 group">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 group-hover:text-brand-700 transition">
              Clínica Veterinaria
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Centro de salud animal que brinda atención médica, cirugías y canaliza adopciones.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition self-center" />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-700 hover:text-brand-800 hover:underline transition"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

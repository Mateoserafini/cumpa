import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Search, ShieldCheck, CalendarCheck, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold uppercase tracking-wider shadow-xs">
              <span className="text-sm">🐾</span> Plataforma Oficial de Adopción
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Encontrá a tu compañero, cuidalo con el corazón.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Cumpa conecta familias adoptantes con refugios y rescatistas verificados, garantizando un seguimiento post-adopción transparente durante 6 meses.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/explorar">
                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={<Search className="w-5 h-5" />}
                  className="shadow-md shadow-brand-600/20"
                >
                  Explorar Mascotas
                </Button>
              </Link>

              {isAuthenticated ? (
                <Link to="/perfil">
                  <Button size="lg" variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Ir a Mi Perfil ({user?.name?.split(' ')[0]})
                  </Button>
                </Link>
              ) : (
                <Link to="/registro">
                  <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Crear una Cuenta
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Características Destacadas */}
      <section className="py-16 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Adopción y Tránsito Responsable
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Postulaciones transparentes donde publicadores y adoptantes alinean compromisos de espacio, cuidado veterinario y afecto.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-warm-100 text-warm-700 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Seguimiento Post-Adopción de 6 Meses
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Un reporte fotográfico mensual para auditar la adaptación y el bienestar del animal en su nuevo hogar definitivo.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Instituciones Verificadas
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Refugios, veterinarias y ONGs validadas mediante CUIT oficial y personería jurídica para prevenir estafas y maltrato.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

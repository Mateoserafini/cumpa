import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/20 to-warm-50/20 flex flex-col justify-between">
      {/* Header simplificado con botón de regreso */}
      <header className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
          <span>Volver al inicio</span>
        </Link>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white text-base shadow-sm">
            🐾
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Cumpa</span>
        </Link>
      </header>

      {/* Contenedor central donde se renderizan LoginForm, RegisterForm, etc. */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Outlet />
      </main>

      {/* Footer minimalista */}
      <footer className="py-6 px-4 text-center text-xs text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} Cumpa 🐾 &bull; Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default AuthLayout;

import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🐾</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Cumpa
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Entrega 2: Arquitectura & Módulos
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 text-4xl shadow-sm mb-6 border border-emerald-100">
          🐾
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Cumpa — Plataforma de Adopción y Seguimiento
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed">
          Estructura modular y arquitectura del frontend inicializada con éxito con Vite, React, TypeScript y Tailwind CSS.
        </p>

        {/* Feature Grid Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl text-left">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="text-xl mb-2">🔐</div>
            <h2 className="font-semibold text-slate-800 mb-1">Módulo Auth</h2>
            <p className="text-xs text-slate-500">Autenticación JWT, registro, perfiles y OAuth Google.</p>
          </div>
          
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="text-xl mb-2">🔍</div>
            <h2 className="font-semibold text-slate-800 mb-1">Módulo Exploración</h2>
            <p className="text-xs text-slate-500">Catálogo, filtros por ubicación, especie y modalidad.</p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="text-xl mb-2">🐶</div>
            <h2 className="font-semibold text-slate-800 mb-1">Módulo Mascotas</h2>
            <p className="text-xs text-slate-500">Gestión de publicaciones, estados y fotos Cloudinary.</p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="text-xl mb-2">📩</div>
            <h2 className="font-semibold text-slate-800 mb-1">Módulo Adopciones</h2>
            <p className="text-xs text-slate-500">Solicitudes de contacto, postulaciones y notificaciones.</p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="text-xl mb-2">📅</div>
            <h2 className="font-semibold text-slate-800 mb-1">Módulo Seguimiento</h2>
            <p className="text-xs text-slate-500">Check-in mensual fotográfico durante 6 meses con alertas.</p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="text-xl mb-2">🛡️</div>
            <h2 className="font-semibold text-slate-800 mb-1">Módulo Admin</h2>
            <p className="text-xs text-slate-500">Validación de instituciones, CUIT y reportes de usuarios.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Trabajo Final Integrador — Grupo Nº 195 | UTN TUPaD</p>
        <p className="mt-1 font-medium text-slate-700">Mateo Serafini & Gonzalo Vega — Tutor: Juan Ignacio Schiavonni</p>
      </footer>
    </div>
  );
};

export default App;

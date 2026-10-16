import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <span className="text-6xl mb-4" role="img" aria-label="Perro confundido">
        🐶
      </span>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
        404 — Página no encontrada
      </h1>
      <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
        Parece que la página que estás buscando no existe o se ha mudado. No te preocupes, nuestros peludos te ayudan a volver.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;

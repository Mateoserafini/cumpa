import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Páginas
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProfilePage } from '@/pages/auth/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Enrutador principal de la aplicación Cumpa (React Router v6).
 * Estructura jerárquica con Layouts compartidos y control de acceso.
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Rutas con AuthLayout (Autenticación / Registro) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>

      {/* 2. Rutas con MainLayout (Navegación general) */}
      <Route element={<MainLayout />}>
        {/* Rutas Públicas */}
        <Route path="/" element={<HomePage />} />

        {/* Rutas Protegidas (Exigen sesión activa con JWT) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/perfil" element={<ProfilePage />} />
          {/* Rutas futuras: /publicar, /mis-publicaciones, /solicitudes, /seguimientos */}
        </Route>

        {/* Ruta comodín 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

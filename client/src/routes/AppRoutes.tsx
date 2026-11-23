import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';

// Páginas
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/exploration/CatalogPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProfilePage } from '@/pages/auth/ProfilePage';
import { OAuthSuccessPage } from '@/pages/auth/OAuthSuccessPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { CreatePetPage } from '@/pages/pets/CreatePetPage';
import { PetDetailPage } from '@/pages/pets/PetDetailPage';
import { MyPublicationsPage } from '@/pages/pets/MyPublicationsPage';
import { ApplicationsInboxPage } from '@/pages/adoptions/ApplicationsInboxPage';
import { TrackingPage } from '@/pages/tracking/TrackingPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Enrutador principal de la aplicación Cumpa (React Router v6).
 * Estructura jerárquica con Layouts compartidos y control de acceso (RBAC).
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Rutas con AuthLayout (Autenticación / Registro / OAuth Callback / Verificación) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/verificar-cuenta" element={<VerifyEmailPage />} />
        <Route path="/verificar-cuenta/:token" element={<VerifyEmailPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/oauth-success" element={<OAuthSuccessPage />} />
        <Route path="/auth/callback" element={<OAuthSuccessPage />} />
      </Route>

      {/* 2. Rutas con MainLayout (Navegación general) */}
      <Route element={<MainLayout />}>
        {/* Rutas Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<CatalogPage />} />
        <Route path="/mascotas/:id" element={<PetDetailPage />} />

        {/* Rutas Protegidas Comunes (Exigen sesión activa con JWT) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/publicar" element={<CreatePetPage />} />
          <Route path="/mis-publicaciones" element={<MyPublicationsPage />} />
          <Route path="/solicitudes" element={<ApplicationsInboxPage />} />
          <Route path="/seguimientos" element={<TrackingPage />} />

          {/* Rutas Exclusivas de Administración (Role: ADMIN) */}
          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/instituciones" element={<AdminDashboardPage />} />
            <Route path="/admin/reportes" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        {/* Ruta comodín 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

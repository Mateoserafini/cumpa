import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Heart,
  PlusCircle,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isInstitution } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'text-brand-700 bg-brand-50 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Marca */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-brand-600 group-hover:bg-brand-700 transition flex items-center justify-center text-white text-xl shadow-sm">
                🐾
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 transition leading-none">
                  Cumpa
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
                  Adopción Responsable
                </span>
              </div>
            </Link>

            {/* Enlaces de Navegación de Escritorio */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" className={navLinkClasses} end>
                Inicio
              </NavLink>
              <NavLink to="/explorar" className={navLinkClasses}>
                Explorar Mascotas
              </NavLink>

              {isAuthenticated && (
                <>
                  <NavLink to="/mis-publicaciones" className={navLinkClasses}>
                    Mis Publicaciones
                  </NavLink>
                  <NavLink to="/solicitudes" className={navLinkClasses}>
                    Solicitudes
                  </NavLink>
                  <NavLink to="/seguimientos" className={navLinkClasses}>
                    Seguimientos
                  </NavLink>
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                          isActive
                            ? 'text-purple-700 bg-purple-50 font-semibold'
                            : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                        }`
                      }
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Admin
                    </NavLink>
                  )}
                </>
              )}
            </nav>

            {/* Zona de Usuario / Botones de Acción */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {(isInstitution || user?.role === 'PARTICULAR') && (
                    <Link to="/publicar">
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<PlusCircle className="w-4 h-4" />}
                        className="shadow-sm"
                      >
                        Publicar Mascota
                      </Button>
                    </Link>
                  )}

                  <Link
                    to="/perfil"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition text-sm text-slate-700"
                    title="Mi Perfil"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs uppercase">
                      {user?.name ? user.name[0] : <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-medium max-w-[120px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase">
                      {user?.role === 'PARTICULAR' ? 'Adoptante' : user?.role}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Cerrar Sesión"
                    aria-label="Cerrar Sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to="/registro">
                    <Button variant="primary" size="sm">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Botón Menú Móvil */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Menú Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
            <NavLink
              to="/"
              className={navLinkClasses}
              onClick={() => setMobileMenuOpen(false)}
              end
            >
              Inicio
            </NavLink>
            <NavLink
              to="/explorar"
              className={navLinkClasses}
              onClick={() => setMobileMenuOpen(false)}
            >
              Explorar Mascotas
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/mis-publicaciones"
                  className={navLinkClasses}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Publicaciones
                </NavLink>
                <NavLink
                  to="/solicitudes"
                  className={navLinkClasses}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Solicitudes
                </NavLink>
                <NavLink
                  to="/seguimientos"
                  className={navLinkClasses}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Seguimientos
                </NavLink>
                <NavLink
                  to="/perfil"
                  className={navLinkClasses}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Perfil ({user?.name})
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className={navLinkClasses}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Panel Administrador
                  </NavLink>
                )}
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    leftIcon={<LogOut className="w-4 h-4" />}
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/registro" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Área de Contenido Principal */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer General */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐾</span>
              <span className="font-bold text-slate-900">Cumpa</span>
              <span className="text-xs text-slate-500">
                &bull; Plataforma Integral de Adopción y Tenencia Responsable
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500">
              Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-0.5 inline" /> por Grupo 195 &bull; UTN TUPaD
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '@/features/auth/services/authService';
import { storage } from '@/utils/storage';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
  AuthResponse,
} from '@/features/auth/types/auth.types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterCredentials) => Promise<RegisterResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = storage.getToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setToken(currentToken);
    } catch (error) {
      console.warn('Sesión no válida o expirada:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Al montar el proveedor, verificar si existe token guardado y recuperar perfil
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  // Escuchar eventos globales de 401 emitidos por el apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('cumpa:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('cumpa:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      // Tras el login exitoso, obtenemos el perfil completo con institutionalProfile
      try {
        const fullProfile = await authService.getMe();
        setUser(fullProfile);
      } catch {
        // Fallback básico con los datos devueltos en el login
        setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          isEmailVerified: response.user.isEmailVerified,
          avatarUrl: response.user.avatarUrl,
        });
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCredentials): Promise<RegisterResponse> => {
    return await authService.register(data);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

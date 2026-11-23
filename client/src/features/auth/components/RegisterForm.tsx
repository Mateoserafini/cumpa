import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, MapPin, Phone, Eye, EyeOff, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';
import { AccountTypeSelector, type AccountRoleOption } from './AccountTypeSelector';
import type { RegisterCredentials } from '../types/auth.types';

export const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Paso 1: Selección de Tipo de Cuenta | Paso 2: Carga de Datos
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<AccountRoleOption>('PARTICULAR');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    province: '',
    city: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasNumber = /\d/;

    if (!formData.name.trim()) {
      errors.name =
        selectedRole === 'PARTICULAR'
          ? 'El nombre completo es obligatorio'
          : 'La razón social o nombre de la entidad es obligatorio';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Debe contener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Ingrese un correo electrónico válido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!hasNumber.test(formData.password)) {
      errors.password = 'Debe incluir al menos un número (0-9)';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.province.trim()) {
      errors.province = 'La provincia es obligatoria';
    }

    if (!formData.city.trim()) {
      errors.city = 'La ciudad o localidad es obligatoria';
    }

    if (formData.phone && (formData.phone.length < 6 || formData.phone.length > 25)) {
      errors.phone = 'Ingrese un número de teléfono válido (6 a 25 dígitos)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: RegisterCredentials = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: selectedRole,
      province: formData.province.trim(),
      city: formData.city.trim(),
      phone: formData.phone.trim() || undefined,
    };

    try {
      await register(payload);
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message ||
          'No se pudo completar el registro. Verifique si el correo ya se encuentra en uso.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de confirmación tras registro exitoso
  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          ¡Cuenta creada con éxito!
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Hemos enviado un correo de activación a <span className="font-semibold text-slate-800">{formData.email}</span>.
          Por favor revisa tu bandeja de entrada o correo no deseado y haz clic en el enlace para verificar tu cuenta antes de iniciar sesión.
        </p>

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          Ir a Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-8">
      {/* Indicador de Pasos */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Paso {step} de 2
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            {step === 1 ? 'Tipo de Registro' : 'Datos de la Cuenta'}
          </h2>
        </div>

        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cambiar tipo
          </button>
        )}
      </div>

      {/* Alerta de Error */}
      {errorMessage && (
        <div className="mb-6">
          <Alert variant="error" title="No se pudo registrar" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </div>
      )}

      {/* PASO 1: Selector de Rol */}
      {step === 1 && (
        <div className="space-y-6">
          <AccountTypeSelector
            value={selectedRole}
            onChange={(role) => setSelectedRole(role)}
          />

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setStep(2)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continuar con{' '}
            {selectedRole === 'PARTICULAR'
              ? 'Adoptante'
              : selectedRole === 'INSTITUCION'
              ? 'Institución'
              : 'Veterinaria'}
          </Button>

          <p className="text-center text-xs text-slate-500">
            ¿Ya tienes cuenta registrada?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      )}

      {/* PASO 2: Formulario de Datos */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="name"
            name="name"
            type="text"
            label={
              selectedRole === 'PARTICULAR'
                ? 'Nombre y Apellido'
                : 'Razón Social / Nombre del Refugio'
            }
            placeholder={
              selectedRole === 'PARTICULAR' ? 'Juan Pérez' : 'Refugio San Francisco de Asís'
            }
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            disabled={isSubmitting}
            required
            leftIcon={<UserIcon className="w-4 h-4" />}
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico"
            placeholder="ejemplo@cumpa.org"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            disabled={isSubmitting}
            required
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              disabled={isSubmitting}
              required
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              label="Confirmar Clave"
              placeholder="Repite la contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
              disabled={isSubmitting}
              required
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-slate-600 focus:outline-none transition p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
          <p className="text-[11px] text-slate-400">
            * La contraseña debe tener al menos 8 caracteres y contener como mínimo un número.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="province"
              name="province"
              type="text"
              label="Provincia"
              placeholder="Buenos Aires"
              value={formData.province}
              onChange={handleChange}
              error={fieldErrors.province}
              disabled={isSubmitting}
              required
              leftIcon={<MapPin className="w-4 h-4" />}
            />

            <Input
              id="city"
              name="city"
              type="text"
              label="Ciudad / Localidad"
              placeholder="La Plata"
              value={formData.city}
              onChange={handleChange}
              error={fieldErrors.city}
              disabled={isSubmitting}
              required
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <Input
            id="phone"
            name="phone"
            type="tel"
            label="Teléfono de Contacto (Opcional)"
            placeholder="+54 11 1234-5678"
            value={formData.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            disabled={isSubmitting}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4 font-semibold shadow-md shadow-brand-600/20"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Completar Registro
          </Button>

          <div className="pt-4 text-center">
            <p className="text-xs text-slate-500">
              Al registrarte aceptas las políticas de bienestar animal y uso responsable de Cumpa.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterForm;

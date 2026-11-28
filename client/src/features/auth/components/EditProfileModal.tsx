import React, { useState, useEffect } from 'react';
import { User as UserIcon, Phone, MapPin, Home, Image as ImageIcon, X, Save } from 'lucide-react';
import { usersService } from '../services/usersService';
import type { User } from '../types/auth.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [province, setProvince] = useState(user.province || '');
  const [city, setCity] = useState(user.city || '');
  const [address, setAddress] = useState(user.address || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setProvince(user.province || '');
      setCity(user.city || '');
      setAddress(user.address || '');
      setAvatarUrl(user.avatarUrl || '');
      setFieldErrors({});
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedProvince = province.trim();
    const trimmedCity = city.trim();
    const trimmedAddress = address.trim();
    const trimmedAvatar = avatarUrl.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.name = 'El nombre debe tener entre 2 y 100 caracteres.';
    }

    if (trimmedPhone.length > 0 && (trimmedPhone.length < 6 || trimmedPhone.length > 25)) {
      errors.phone = 'El teléfono debe tener entre 6 y 25 caracteres.';
    }

    if (!trimmedProvince) {
      errors.province = 'La provincia es obligatoria.';
    }

    if (!trimmedCity) {
      errors.city = 'La ciudad o localidad es obligatoria.';
    }

    if (trimmedAddress.length > 200) {
      errors.address = 'La dirección no puede superar los 200 caracteres.';
    }

    if (trimmedAvatar.length > 0) {
      try {
        const parsed = new URL(trimmedAvatar);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.avatarUrl = 'La URL de la foto debe comenzar con http:// o https://.';
        }
      } catch {
        errors.avatarUrl = 'Ingrese una URL válida para la foto de perfil.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await usersService.updateProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
        province: province.trim(),
        city: city.trim(),
        address: address.trim() ? address.trim() : null,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'No fue posible actualizar tu perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Cerrar modal de edición de perfil"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Mi Cuenta
          </span>
        </div>

        <h3 id="edit-profile-title" className="text-xl font-bold text-slate-900 mb-1">
          Editar Datos de Perfil
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Actualiza tu información de contacto y ubicación para facilitar las adopciones y seguimientos.
        </p>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error al guardar" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="profile-name"
            name="name"
            type="text"
            label="Nombre Completo o Razón Social"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={fieldErrors.name}
            disabled={isSubmitting}
            required
            leftIcon={<UserIcon className="w-4 h-4" />}
          />

          <Input
            id="profile-phone"
            name="phone"
            type="tel"
            label="Teléfono de Contacto (Opcional)"
            placeholder="+54 11 1234-5678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
            }}
            error={fieldErrors.phone}
            disabled={isSubmitting}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="profile-province"
              name="province"
              type="text"
              label="Provincia"
              placeholder="Ej: Buenos Aires"
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                if (fieldErrors.province) setFieldErrors((prev) => ({ ...prev, province: '' }));
              }}
              error={fieldErrors.province}
              disabled={isSubmitting}
              required
              leftIcon={<MapPin className="w-4 h-4" />}
            />

            <Input
              id="profile-city"
              name="city"
              type="text"
              label="Ciudad / Localidad"
              placeholder="Ej: La Plata"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
              }}
              error={fieldErrors.city}
              disabled={isSubmitting}
              required
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <Input
            id="profile-address"
            name="address"
            type="text"
            label="Dirección (Opcional)"
            placeholder="Ej: Av. San Martín 1234"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
            }}
            error={fieldErrors.address}
            disabled={isSubmitting}
            leftIcon={<Home className="w-4 h-4" />}
          />

          <Input
            id="profile-avatarUrl"
            name="avatarUrl"
            type="url"
            label="URL de Foto de Perfil (Opcional)"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              if (fieldErrors.avatarUrl) setFieldErrors((prev) => ({ ...prev, avatarUrl: '' }));
            }}
            error={fieldErrors.avatarUrl}
            disabled={isSubmitting}
            leftIcon={<ImageIcon className="w-4 h-4" />}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;

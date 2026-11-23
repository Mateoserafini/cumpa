import React from 'react';
import { User, Building2, Stethoscope, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { UserRole } from '../types/auth.types';

export type AccountRoleOption = Extract<UserRole, 'PARTICULAR' | 'INSTITUCION' | 'VETERINARIA'>;

interface AccountTypeSelectorProps {
  value: AccountRoleOption;
  onChange: (role: AccountRoleOption) => void;
  disabled?: boolean;
}

interface OptionConfig {
  role: AccountRoleOption;
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

const options: OptionConfig[] = [
  {
    role: 'PARTICULAR',
    title: 'Particular / Adoptante',
    badge: 'Persona Física',
    description:
      'Quiero postularme para adoptar, ofrecer hogar de tránsito temporal o dar en adopción responsable.',
    icon: <User className="w-5 h-5 text-brand-600" />,
  },
  {
    role: 'INSTITUCION',
    title: 'Refugio u ONG',
    badge: 'Persona Jurídica',
    description:
      'Represento a una asociación protectora u organización sin fines de lucro con personería jurídica y CUIT.',
    icon: <Building2 className="w-5 h-5 text-amber-600" />,
  },
  {
    role: 'VETERINARIA',
    title: 'Clínica Veterinaria',
    badge: 'Profesional de Salud',
    description:
      'Centro de atención médica veterinaria que colabora con rescates, vacunación y canaliza adopciones.',
    icon: <Stethoscope className="w-5 h-5 text-sky-600" />,
  },
];

export const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Seleccionar tipo de cuenta">
      {options.map((option) => {
        const isSelected = value === option.role;

        return (
          <div
            key={option.role}
            role="radio"
            aria-checked={isSelected}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && onChange(option.role)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                onChange(option.role);
              }
            }}
            className={cn(
              'relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none text-left',
              isSelected
                ? 'border-brand-600 bg-brand-50/40 shadow-xs ring-1 ring-brand-600/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            {/* Contenedor de Icono */}
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                isSelected ? 'bg-white shadow-xs' : 'bg-slate-100'
              )}
            >
              {option.icon}
            </div>

            {/* Contenido descriptivo */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {option.title}
                </h4>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    isSelected
                      ? 'bg-brand-100 text-brand-800'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {option.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {option.description}
              </p>
            </div>

            {/* Indicador de Selección Circular */}
            <div
              className={cn(
                'absolute right-4 top-4 w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                isSelected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white'
              )}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AccountTypeSelector;

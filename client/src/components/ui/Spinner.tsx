import React from 'react';
import { cn } from '@/utils/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'brand' | 'white' | 'slate' | 'current';
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const variantClasses = {
  brand: 'border-brand-200 border-t-brand-600',
  white: 'border-white/30 border-t-white',
  slate: 'border-slate-200 border-t-slate-600',
  current: 'border-current/30 border-t-current',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'brand',
  label = 'Cargando...',
  className,
  ...props
}) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;

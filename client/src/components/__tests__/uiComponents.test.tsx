import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/feedback/Alert';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { AccountTypeSelector } from '@/features/auth/components/AccountTypeSelector';
import { ENV } from '@/config/env.config';

describe('UI Core Components', () => {
  describe('Button', () => {
    it('renders children, fires onClick, and disables when isLoading', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      const { rerender } = render(
        <Button onClick={onClick} rightIcon={<span data-testid="right-icon">→</span>}>
          Guardar
        </Button>
      );

      const btn = screen.getByRole('button', { name: /Guardar/i });
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      await user.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);

      rerender(
        <Button onClick={onClick} isLoading rightIcon={<span data-testid="right-icon">→</span>}>
          Guardar
        </Button>
      );
      expect(btn).toBeDisabled();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('renders label, helperText, and switches to error with aria-invalid', () => {
      const { rerender } = render(
        <Input id="email" name="email" label="Correo" helperText="Usá tu correo habitual" required />
      );

      const input = screen.getByLabelText(/Correo/i);
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByText('Usá tu correo habitual')).toBeInTheDocument();

      rerender(<Input id="email" name="email" label="Correo" error="Correo inválido" />);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Correo inválido')).toBeInTheDocument();
      expect(screen.queryByText('Usá tu correo habitual')).not.toBeInTheDocument();
    });
  });

  describe('Alert', () => {
    it('renders role="alert", title, content, and close button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Alert variant="error" title="Error crítico" onClose={onClose}>
          Algo salió mal
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error crítico')).toBeInTheDocument();
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Cerrar alerta/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('GoogleAuthButton', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: 'http://localhost:5173/login' },
      });
    });

    it('redirects to Google OAuth without role query when role is omitted', async () => {
      const user = userEvent.setup();
      render(<GoogleAuthButton />);

      await user.click(screen.getByRole('button', { name: /Continuar con Google/i }));
      expect(window.location.href).toBe(`${ENV.API_URL}/auth/google`);
    });

    it('appends encoded role query param when role prop is provided', async () => {
      const user = userEvent.setup();
      render(<GoogleAuthButton role="INSTITUCION" label="Registrarse con Google" />);

      await user.click(screen.getByRole('button', { name: /Registrarse con Google/i }));
      expect(window.location.href).toBe(`${ENV.API_URL}/auth/google?role=INSTITUCION`);
    });

    it('disables button while loading', () => {
      render(<GoogleAuthButton isLoading role="VETERINARIA" />);
      expect(screen.getByRole('button')).toBeDisabled();
      Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
    });
  });

  describe('AccountTypeSelector', () => {
    it('selects roles via click and keyboard and respects disabled', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const { rerender } = render(
        <AccountTypeSelector value="PARTICULAR" onChange={onChange} />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
      expect(radios[0]).toHaveAttribute('aria-checked', 'true');

      await user.click(radios[1]);
      expect(onChange).toHaveBeenCalledWith('INSTITUCION');

      radios[2].focus();
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('VETERINARIA');

      onChange.mockClear();
      rerender(<AccountTypeSelector value="PARTICULAR" onChange={onChange} disabled />);
      await user.click(screen.getAllByRole('radio')[1]);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

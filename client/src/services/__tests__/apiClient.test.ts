import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { storage } from '@/utils/storage';

type RequestInterceptorHandler = {
  fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
};

type ResponseInterceptorHandler = {
  fulfilled: (response: unknown) => unknown;
  rejected: (error: AxiosError) => Promise<never>;
};

describe('apiClient interceptors & ENDPOINTS', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('injects Authorization Bearer header when token is present', () => {
    storage.setToken('abc.def.ghi');
    const handlers = (
      apiClient.interceptors.request as unknown as { handlers: RequestInterceptorHandler[] }
    ).handlers;
    const reqHandler = handlers[0].fulfilled;

    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = reqHandler(config);

    expect(result.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('does not set Authorization header when no token exists', () => {
    const handlers = (
      apiClient.interceptors.request as unknown as { handlers: RequestInterceptorHandler[] }
    ).handlers;
    const reqHandler = handlers[0].fulfilled;

    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = reqHandler(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('normalizes network errors when response is missing', async () => {
    const handlers = (
      apiClient.interceptors.response as unknown as { handlers: ResponseInterceptorHandler[] }
    ).handlers;
    const resRejected = handlers[0].rejected;

    await expect(resRejected({ message: 'Network Error' } as AxiosError)).rejects.toThrow(
      /No se pudo conectar con el servidor/
    );
  });

  it('clears token and dispatches cumpa:unauthorized event on 401', async () => {
    storage.setToken('expired-token');
    const listener = vi.fn();
    window.addEventListener('cumpa:unauthorized', listener);

    const handlers = (
      apiClient.interceptors.response as unknown as { handlers: ResponseInterceptorHandler[] }
    ).handlers;
    const resRejected = handlers[0].rejected;

    const error401 = {
      message: 'Request failed with status code 401',
      response: {
        status: 401,
        data: { message: 'Token expirado.' },
      },
    } as AxiosError;

    await expect(resRejected(error401)).rejects.toMatchObject({
      message: 'Token expirado.',
      status: 401,
      isAxiosError: true,
    });

    expect(storage.getToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('cumpa:unauthorized', listener);
  });

  it('prioritizes detailed express-validator errors over generic message on 400', async () => {
    const handlers = (
      apiClient.interceptors.response as unknown as { handlers: ResponseInterceptorHandler[] }
    ).handlers;
    const resRejected = handlers[0].rejected;

    const error400 = {
      message: 'Bad Request',
      response: {
        status: 400,
        data: {
          message: 'Errores de validación en la solicitud.',
          errors: [
            { field: 'cuit', message: 'El CUIT ingresado no es válido.' },
            { field: 'legalName', message: 'La razón social es obligatoria.' },
          ],
        },
      },
    } as AxiosError;

    await expect(resRejected(error400)).rejects.toThrow(
      'El CUIT ingresado no es válido. La razón social es obligatoria.'
    );
  });

  it('encodes verification tokens in ENDPOINTS.AUTH.VERIFY_EMAIL', () => {
    expect(ENDPOINTS.AUTH.VERIFY_EMAIL('tok/with?chars')).toBe(
      '/auth/verify-email/tok%2Fwith%3Fchars'
    );
  });
});

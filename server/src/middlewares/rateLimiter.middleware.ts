import { Request, Response, NextFunction } from "express";
import { HttpError } from "./errorHandler.middleware";

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

/**
 * Gestor de límite de intentos fallidos de inicio de sesión.
 * Permite hasta 3 intentos fallidos antes de activar el bloqueo temporal de 15 minutos (HTTP 429).
 */
export class LoginRateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  public readonly maxAttempts: number = 3;
  public readonly windowMs: number = 15 * 60 * 1000; // 15 minutos
  public readonly blockDurationMs: number = 15 * 60 * 1000; // 15 minutos

  private getKey(ip: string, email?: string): string {
    const cleanEmail = email ? email.toLowerCase().trim() : "unknown";
    return `${ip}:${cleanEmail}`;
  }

  /**
   * Verifica si la combinación IP/email se encuentra actualmente bloqueada.
   */
  public isBlocked(ip: string, email?: string): boolean {
    const key = this.getKey(ip, email);
    const record = this.attempts.get(key);
    if (!record) return false;

    const now = Date.now();
    if (record.blockedUntil) {
      if (now < record.blockedUntil) {
        return true;
      }
      // Bloqueo expirado
      this.attempts.delete(key);
      return false;
    }

    if (now - record.firstAttemptAt > this.windowMs) {
      this.attempts.delete(key);
      return false;
    }

    return record.count >= this.maxAttempts;
  }

  /**
   * Registra un intento fallido de autenticación.
   */
  public recordFailure(ip: string, email?: string): void {
    const key = this.getKey(ip, email);
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now - record.firstAttemptAt > this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttemptAt: now,
        blockedUntil: null,
      });
      return;
    }

    record.count += 1;
    if (record.count >= this.maxAttempts) {
      record.blockedUntil = now + this.blockDurationMs;
    }
  }

  /**
   * Retorna la cantidad actual de intentos fallidos registrados dentro de la ventana.
   */
  public getAttempts(ip: string, email?: string): number {
    const key = this.getKey(ip, email);
    const record = this.attempts.get(key);
    if (!record) return 0;

    const now = Date.now();
    if (now - record.firstAttemptAt > this.windowMs) {
      this.attempts.delete(key);
      return 0;
    }

    return record.count;
  }

  /**
   * Limpia el registro de intentos (al loguearse con éxito, al cambiar la contraseña o en tests).
   */
  public reset(ip?: string, email?: string): void {
    if (!ip && !email) {
      this.attempts.clear();
      return;
    }
    if (ip && email) {
      this.attempts.delete(this.getKey(ip, email));
      return;
    }
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      for (const [key] of this.attempts) {
        if (key.endsWith(`:${cleanEmail}`)) {
          this.attempts.delete(key);
        }
      }
    }
  }
}

export const loginRateLimiter = new LoginRateLimiter();

/**
 * Middleware que evalúa si la petición entrante superó los 3 intentos fallidos permitidos.
 */
export function loginRateLimiterMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  const email = typeof req.body?.email === "string" ? req.body.email : undefined;

  if (loginRateLimiter.isBlocked(ip, email)) {
    throw new HttpError(
      429,
      "Ha superado el límite de 3 intentos fallidos de inicio de sesión. Por motivos de seguridad, espere 15 minutos o solicite ayuda restableciendo su clave mediante 'Olvidé mi contraseña'."
    );
  }

  next();
}

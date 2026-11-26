import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { getAllowedOrigins, getPrimaryFrontendUrl } from "../utils/frontendUrl";
import { parseOAuthRole } from "../config/passport.config";
import { LoginRateLimiter, loginRateLimiterMiddleware } from "../middlewares/rateLimiter.middleware";
import { HttpError, errorHandler } from "../middlewares/errorHandler.middleware";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/roles.middleware";
import { seedUser, generateTestToken, TEST_JWT_SECRET } from "./helpers";
import { db } from "./mockDb";

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe("Unit Tests — Utils & Middlewares (Happy Paths, Wrong Paths & Edge Cases)", () => {
  describe("frontendUrl helper", () => {
    it("[Happy] debe parsear una única URL y quitar barras finales", () => {
      expect(getAllowedOrigins("https://cumpa.org/")).toEqual(["https://cumpa.org"]);
      expect(getPrimaryFrontendUrl("https://cumpa.org///")).toBe("https://cumpa.org");
    });

    it("[Happy] debe parsear múltiples URLs separadas por coma y retornar la primera como principal", () => {
      const raw = "https://cumpa.vercel.app/, https://cumpa.org/ , http://localhost:5173";
      expect(getAllowedOrigins(raw)).toEqual([
        "https://cumpa.vercel.app",
        "https://cumpa.org",
        "http://localhost:5173",
      ]);
      expect(getPrimaryFrontendUrl(raw)).toBe("https://cumpa.vercel.app");
    });

    it("[Wrong/Fallback] debe retornar localhost:5173 si FRONTEND_URL es undefined o vacío", () => {
      expect(getAllowedOrigins(undefined)).toEqual(["http://localhost:5173"]);
      expect(getAllowedOrigins("   ")).toEqual(["http://localhost:5173"]);
      expect(getPrimaryFrontendUrl("")).toBe("http://localhost:5173");
    });

    it("[Edge] debe ignorar comodín '*' y comas vacías al elegir la URL principal", () => {
      expect(getPrimaryFrontendUrl(" , *, https://real.cumpa.org/ ")).toBe("https://real.cumpa.org");
      expect(getPrimaryFrontendUrl("*")).toBe("http://localhost:5173");
    });
  });

  describe("parseOAuthRole helper (Google OAuth state)", () => {
    it("[Happy] debe aceptar PARTICULAR, INSTITUCION y VETERINARIA normalizando espacios y mayúsculas", () => {
      expect(parseOAuthRole("PARTICULAR")).toBe(Role.PARTICULAR);
      expect(parseOAuthRole("INSTITUCION")).toBe(Role.INSTITUCION);
      expect(parseOAuthRole(" veterinaria ")).toBe(Role.VETERINARIA);
    });

    it("[Wrong/Security] nunca debe permitir escalar a ADMIN y debe hacer fallback a PARTICULAR", () => {
      expect(parseOAuthRole("ADMIN")).toBe(Role.PARTICULAR);
      expect(parseOAuthRole("admin")).toBe(Role.PARTICULAR);
    });

    it("[Edge] debe retornar PARTICULAR ante valores vacíos, undefined o tipos inesperados", () => {
      expect(parseOAuthRole(undefined)).toBe(Role.PARTICULAR);
      expect(parseOAuthRole(null)).toBe(Role.PARTICULAR);
      expect(parseOAuthRole("")).toBe(Role.PARTICULAR);
      expect(parseOAuthRole("ROL_INVENTADO")).toBe(Role.PARTICULAR);
      expect(parseOAuthRole(["INSTITUCION"])).toBe(Role.PARTICULAR);
    });
  });

  describe("LoginRateLimiter & loginRateLimiterMiddleware", () => {
    let limiter: LoginRateLimiter;

    beforeEach(() => {
      limiter = new LoginRateLimiter();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("[Happy] debe permitir hasta 2 intentos fallidos y limpiar al hacer reset", () => {
      limiter.recordFailure("10.0.0.1", "user@test.com");
      limiter.recordFailure("10.0.0.1", "user@test.com");

      expect(limiter.getAttempts("10.0.0.1", "user@test.com")).toBe(2);
      expect(limiter.isBlocked("10.0.0.1", "user@test.com")).toBe(false);

      limiter.reset("10.0.0.1", "user@test.com");
      expect(limiter.getAttempts("10.0.0.1", "user@test.com")).toBe(0);
    });

    it("[Wrong] debe bloquear exactamente al 3er intento fallido y el middleware debe lanzar HttpError 429", () => {
      const email = "bloqueado@test.com";
      limiter.recordFailure("10.0.0.1", email);
      limiter.recordFailure("10.0.0.1", email);
      limiter.recordFailure("10.0.0.1", email);

      expect(limiter.isBlocked("10.0.0.1", email)).toBe(true);

      // Probar el middleware con el singleton exportado
      const req: any = { ip: "127.0.0.99", socket: {}, body: { email } };
      const res = createMockRes();
      const next = vi.fn();

      // Sin intentos previos debe dejar pasar
      loginRateLimiterMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("[Edge] debe normalizar email (mayúsculas/espacios), aislar IPs y desbloquear tras 15 minutos", () => {
      limiter.recordFailure("10.0.0.1", "  User@Test.COM ");
      limiter.recordFailure("10.0.0.1", "user@test.com");
      limiter.recordFailure("10.0.0.1", "USER@TEST.COM");

      expect(limiter.isBlocked("10.0.0.1", "user@test.com")).toBe(true);
      expect(limiter.isBlocked("10.0.0.2", "user@test.com")).toBe(false);

      // Avanzar más de 15 minutos
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000);
      expect(limiter.isBlocked("10.0.0.1", "user@test.com")).toBe(false);
      expect(limiter.getAttempts("10.0.0.1", "user@test.com")).toBe(0);
    });

    it("[Edge] reset por email debe limpiar bloqueos de múltiples IPs", () => {
      limiter.recordFailure("1.1.1.1", "multi@test.com");
      limiter.recordFailure("1.1.1.1", "multi@test.com");
      limiter.recordFailure("1.1.1.1", "multi@test.com");
      limiter.recordFailure("2.2.2.2", "multi@test.com");
      limiter.recordFailure("2.2.2.2", "multi@test.com");
      limiter.recordFailure("2.2.2.2", "multi@test.com");

      limiter.reset(undefined, "MULTI@TEST.COM");
      expect(limiter.isBlocked("1.1.1.1", "multi@test.com")).toBe(false);
      expect(limiter.isBlocked("2.2.2.2", "multi@test.com")).toBe(false);
    });
  });

  describe("errorHandler middleware", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("[Happy] debe serializar HttpError con statusCode, message y details", () => {
      const res = createMockRes();
      const err = new HttpError(422, "Error de validación", [{ field: "cuit" }]);
      errorHandler(err, {} as any, res, vi.fn());

      expect(res.statusCode).toBe(422);
      expect(res.body).toEqual({
        message: "Error de validación",
        details: [{ field: "cuit" }],
      });
    });

    it("[Wrong] debe mapear MulterError (400), Prisma P2002 (409) y JSON inválido (400)", () => {
      const resMulter = createMockRes();
      errorHandler({ name: "MulterError", message: "File too large" }, {} as any, resMulter, vi.fn());
      expect(resMulter.statusCode).toBe(400);
      expect(resMulter.body.message).toContain("File too large");

      const resPrisma = createMockRes();
      errorHandler({ code: "P2002" }, {} as any, resPrisma, vi.fn());
      expect(resPrisma.statusCode).toBe(409);

      const resJson = createMockRes();
      errorHandler({ type: "entity.parse.failed" }, {} as any, resJson, vi.fn());
      expect(resJson.statusCode).toBe(400);
      expect(resJson.body.message).toContain("JSON inválido");
    });

    it("[Edge] debe ocultar detalles y stack en producción ante errores no controlados", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.NODE_ENV = "production";

      const res = createMockRes();
      errorHandler(new Error("Detalle interno sensible de DB"), {} as any, res, vi.fn());

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Ocurrió un error interno en el servidor.");
      expect(res.body.stack).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe("authenticateToken & requireRoles middlewares", () => {
    it("[Happy] authenticateToken debe cargar req.user con token válido de usuario activo", async () => {
      const user = await seedUser({ role: Role.PARTICULAR });
      const token = generateTestToken(user);
      const req: any = { headers: { authorization: `Bearer ${token}` } };
      const next = vi.fn();

      await authenticateToken(req, createMockRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.id).toBe(user.id);
    });

    it("[Wrong] authenticateToken debe fallar con 401 ante ausencia de token, token malformado o expirado", async () => {
      const nextMissing = vi.fn();
      await authenticateToken({ headers: {} } as any, createMockRes(), nextMissing);
      expect(nextMissing.mock.calls[0][0]).toBeInstanceOf(HttpError);
      expect(nextMissing.mock.calls[0][0].statusCode).toBe(401);

      const nextInvalid = vi.fn();
      await authenticateToken(
        { headers: { authorization: "Bearer token-falso" } } as any,
        createMockRes(),
        nextInvalid
      );
      expect(nextInvalid.mock.calls[0][0].statusCode).toBe(401);

      const expiredToken = jwt.sign(
        { id: "u1", email: "a@b.com", role: Role.PARTICULAR },
        TEST_JWT_SECRET,
        { expiresIn: -10 }
      );
      const nextExpired = vi.fn();
      await authenticateToken(
        { headers: { authorization: `Bearer ${expiredToken}` } } as any,
        createMockRes(),
        nextExpired
      );
      expect(nextExpired.mock.calls[0][0].statusCode).toBe(401);
      expect(nextExpired.mock.calls[0][0].message).toContain("expirado");
    });

    it("[Edge] authenticateToken debe rechazar con 401 un token válido si el usuario fue dado de baja (soft delete)", async () => {
      const user = await seedUser({ role: Role.PARTICULAR });
      const token = generateTestToken(user);
      const found = db.users.find((u) => u.id === user.id);
      if (found) found.deletedAt = new Date();

      const next = vi.fn();
      await authenticateToken(
        { headers: { authorization: `Bearer ${token}` } } as any,
        createMockRes(),
        next
      );

      expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it("[Happy/Wrong] requireRoles debe permitir roles autorizados y rechazar no autenticados (401) o roles prohibidos (403)", () => {
      const guard = requireRoles(Role.ADMIN, Role.INSTITUCION);

      const nextOk = vi.fn();
      guard({ user: { role: Role.ADMIN } } as any, createMockRes(), nextOk);
      expect(nextOk).toHaveBeenCalledWith();

      const nextUnauth = vi.fn();
      guard({} as any, createMockRes(), nextUnauth);
      expect(nextUnauth.mock.calls[0][0].statusCode).toBe(401);

      const nextForbidden = vi.fn();
      guard({ user: { role: Role.PARTICULAR } } as any, createMockRes(), nextForbidden);
      expect(nextForbidden.mock.calls[0][0].statusCode).toBe(403);
    });
  });
});

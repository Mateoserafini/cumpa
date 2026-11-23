import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import app from "../app";
import emailService from "../modules/notifications/email.service";

describe("Integration Tests — Security, CORS, Routing & Email Links", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    emailService.reset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    emailService.reset();
    vi.restoreAllMocks();
  });

  describe("Healthcheck, 404 y JSON malformado", () => {
    it("[Happy] GET /health debe retornar estado operativo 200", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.service).toBe("Cumpa API");
    });

    it("[Wrong] debe devolver 404 para rutas inexistentes", async () => {
      const res = await request(app).get("/api/ruta-que-no-existe");
      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Ruta no encontrada");
    });

    it("[Edge] debe responder 400 ante un cuerpo JSON malformado", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send("{ email: sin-comillas");

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("JSON inválido");
    });
  });

  describe("Política CORS endurecida", () => {
    it("[Happy] debe permitir orígenes listados en FRONTEND_URL (múltiples separados por coma y con barra final)", async () => {
      process.env.NODE_ENV = "production";
      process.env.FRONTEND_URL = "https://cumpa.vercel.app/, https://cumpa.org/";

      const res = await request(app)
        .get("/health")
        .set("Origin", "https://cumpa.org");

      expect(res.status).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe("https://cumpa.org");
    });

    it("[Happy] debe permitir peticiones sin encabezado Origin (curl, healthchecks)", async () => {
      process.env.NODE_ENV = "production";
      process.env.FRONTEND_URL = "https://cumpa.org";

      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    });

    it("[Wrong/Security] debe rechazar un dominio *.vercel.app de terceros que no figure en FRONTEND_URL", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.NODE_ENV = "production";
      process.env.FRONTEND_URL = "https://cumpa-oficial.vercel.app";

      const res = await request(app)
        .get("/health")
        .set("Origin", "https://atacante-externo.vercel.app");

      expect(res.status).toBe(500);
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe("Google OAuth sin credenciales configuradas", () => {
    it("[Wrong] GET /api/auth/google y /callback deben devolver 501 si no hay credenciales", async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const resStart = await request(app).get("/api/auth/google");
      expect(resStart.status).toBe(501);

      const resCb = await request(app).get("/api/auth/google/callback");
      expect(resCb.status).toBe(501);
    });
  });

  describe("Generación segura de enlaces en EmailService con múltiples FRONTEND_URL", () => {
    it("[Happy/Edge] debe usar solo la primera URL de FRONTEND_URL y apuntar a /solicitudes en nueva postulación", async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.FRONTEND_URL = "https://cumpa-prod.vercel.app/, https://otro-dominio.com";

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await emailService.sendNewApplicationNotice(
        "rescatista@test.com",
        "Refugio Sol",
        "Luna",
        "Carlos"
      );

      const fullOutput = logSpy.mock.calls.map((args) => args.join(" ")).join("\n");
      expect(fullOutput).toContain("https://cumpa-prod.vercel.app/solicitudes");
      expect(fullOutput).not.toContain("/panel/postulaciones");
      expect(fullOutput).not.toContain("otro-dominio.com");

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, resetMockDb } from "./mockDb";
import { seedUser } from "./helpers";
import { Role } from "@prisma/client";
import { loginRateLimiter } from "../middlewares/rateLimiter.middleware";

describe("Auth Integration Tests (/api/auth)", () => {
  beforeEach(() => {
    resetMockDb();
    loginRateLimiter.reset();
  });

  describe("POST /api/auth/register", () => {
    it("debe registrar un usuario exitosamente con rol PARTICULAR y email no verificado", async () => {
      const payload = {
        email: "nuevo.usuario@cumpa.org",
        password: "Password123!",
        name: "Carlos Adoptante",
        role: Role.PARTICULAR,
        province: "Buenos Aires",
        city: "Mar del Plata",
        phone: "2234567890",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("userId");
      expect(response.body.message).toMatch(/éxito/i);

      // Verificar persistencia en base de datos
      const userInDb = db.users.find((u) => u.email === payload.email);
      expect(userInDb).toBeDefined();
      expect(userInDb?.isEmailVerified).toBe(false);
      expect(userInDb?.verificationToken).toBeTruthy();
    });

    it("debe rechazar el registro con código 409 si el email ya existe", async () => {
      await seedUser({ email: "existente@cumpa.org" });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "existente@cumpa.org",
          password: "Password123!",
          name: "Carlos Duplicado",
          role: Role.PARTICULAR,
          province: "Buenos Aires",
          city: "La Plata",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/ya existe/i);
    });

    it("debe rechazar con código 400 si los campos obligatorios están ausentes o son inválidos", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "email-invalido",
          password: "123", // Muy corta
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/auth/login y Rate Limiting (3 intentos fallidos)", () => {
    it("debe iniciar sesión exitosamente si las credenciales son válidas y el email está verificado", async () => {
      const user = await seedUser({
        email: "activo@cumpa.org",
        passwordHash: "Password123!",
        isEmailVerified: true,
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: "Password123!",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.isEmailVerified).toBe(true);
    });

    it("debe responder con 403 si el usuario tiene credenciales válidas pero el email NO está verificado", async () => {
      const user = await seedUser({
        email: "no-verificado@cumpa.org",
        passwordHash: "Password123!",
        isEmailVerified: false,
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: "Password123!",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/debe verificar su dirección de correo/i);
    });

    it("debe bloquear con HTTP 429 tras exactamente 3 intentos fallidos de login", async () => {
      const user = await seedUser({
        email: "victima.fuerzabruta@cumpa.org",
        passwordHash: "CorrectPassword123!",
        isEmailVerified: true,
      });

      // Intento fallido 1
      const res1 = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "WrongPassword1" });
      expect(res1.status).toBe(401);

      // Intento fallido 2
      const res2 = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "WrongPassword2" });
      expect(res2.status).toBe(401);

      // Intento fallido 3
      const res3 = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "WrongPassword3" });
      expect(res3.status).toBe(401);

      // Intento 4: Debe disparar rate limiting (429) inmediatamente
      const res4 = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "CorrectPassword123!" });
      expect(res4.status).toBe(429);
      expect(res4.body.message).toMatch(/límite de 3 intentos fallidos/i);
    });
  });

  describe("GET /api/auth/verify-email/:token", () => {
    it("debe confirmar el email y habilitar la cuenta con un token válido", async () => {
      const token = "token_de_verificacion_seguro_12345";
      const user = await seedUser({
        email: "pendiente.verificar@cumpa.org",
        isEmailVerified: false,
        verificationToken: token,
      });

      const response = await request(app).get(`/api/auth/verify-email/${token}`);

      expect(response.status).toBe(200);
      expect(response.body.verified).toBe(true);

      const updatedUser = db.users.find((u) => u.id === user.id);
      expect(updatedUser?.isEmailVerified).toBe(true);
      expect(updatedUser?.verificationToken).toBeNull();
    });

    it("debe devolver 400 si el token de verificación no existe o ya fue usado", async () => {
      const response = await request(app).get("/api/auth/verify-email/token-inexistente-xyz");

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/inválido o ya fue utilizado/i);
    });
  });

  describe("POST /api/auth/forgot-password y POST /api/auth/reset-password", () => {
    it("debe generar un token de reseteo para un usuario existente", async () => {
      const user = await seedUser({
        email: "olvidadizo@cumpa.org",
        isEmailVerified: true,
      });

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: user.email });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/recibirá las instrucciones/i);

      const updated = db.users.find((u) => u.id === user.id);
      expect(updated?.resetPasswordToken).toBeTruthy();
      expect(updated?.resetPasswordExpires).toBeInstanceOf(Date);
    });

    it("debe actualizar la contraseña y permitir login con la nueva clave", async () => {
      const resetToken = "token_reset_clave_abcdef";
      const user = await seedUser({
        email: "reseteador@cumpa.org",
        isEmailVerified: true,
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hora a futuro
      });

      const resetRes = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: resetToken,
          newPassword: "NuevaClaveSuperSegura99!",
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toMatch(/actualizada con éxito/i);

      // Ahora el login debe funcionar con la nueva contraseña
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: "NuevaClaveSuperSegura99!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty("token");
    });

    it("debe rechazar con 400 si el token de restablecimiento es inválido", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "token-falso",
          newPassword: "Password123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/inválido o ha expirado/i);
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { Role, VerificationStatus } from "@prisma/client";
import { seedUser, seedInstitutionalProfile, generateTestToken } from "./helpers";
import { db } from "./mockDb";

describe("Users & Profiles Integration Tests (/api/users)", () => {
  beforeEach(() => {
    // db is automatically reset in setup.ts
  });

  describe("GET /api/users/profile", () => {
    it("debe rechazar con 401 si no se envía token de autenticación", async () => {
      const res = await request(app).get("/api/users/profile");
      expect(res.status).toBe(401);
    });

    it("debe retornar los datos del perfil del usuario autenticado", async () => {
      const user = await seedUser({
        name: "María Gómez",
        role: Role.PARTICULAR,
        province: "Córdoba",
        city: "Córdoba Capital",
      });
      const token = generateTestToken(user);

      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
      expect(res.body.name).toBe("María Gómez");
      expect(res.body.email).toBe(user.email);
      expect(res.body.role).toBe(Role.PARTICULAR);
      expect(res.body.province).toBe("Córdoba");
      expect(res.body.city).toBe("Córdoba Capital");
    });
  });

  describe("PUT /api/users/profile", () => {
    it("debe actualizar los datos de contacto y ubicación del perfil", async () => {
      const user = await seedUser({ name: "Nombre Antiguo", phone: "111111" });
      const token = generateTestToken(user);

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Nombre Nuevo",
          phone: "1198765432",
          address: "Av. Siempre Viva 742",
          province: "Santa Fe",
          city: "Rosario",
        });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Nombre Nuevo");
      expect(res.body.user.phone).toBe("1198765432");
      expect(res.body.user.address).toBe("Av. Siempre Viva 742");
      expect(res.body.user.province).toBe("Santa Fe");
      expect(res.body.user.city).toBe("Rosario");
    });

    it("debe validar longitud y formato de los campos editados", async () => {
      const user = await seedUser();
      const token = generateTestToken(user);

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "A", // Menos de 2 caracteres
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("POST /api/users/institutional-verification", () => {
    it("debe rechazar con 403 a un usuario con rol PARTICULAR", async () => {
      const particular = await seedUser({ role: Role.PARTICULAR });
      const token = generateTestToken(particular);

      const res = await request(app)
        .post("/api/users/institutional-verification")
        .set("Authorization", `Bearer ${token}`)
        .field("legalName", "Asociación Protectora")
        .field("cuit", "30-11111111-8");

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("INSTITUCION, VETERINARIA");
    });

    it("debe rechazar con 400 si el CUIT posee un dígito verificador erróneo", async () => {
      const instUser = await seedUser({ role: Role.INSTITUCION });
      const token = generateTestToken(instUser);

      const res = await request(app)
        .post("/api/users/institutional-verification")
        .set("Authorization", `Bearer ${token}`)
        .field("legalName", "Refugio Patitas")
        .field("cuit", "30-11111111-9"); // Inválido (debe terminar en 8)

      expect(res.status).toBe(400);
    });

    it("debe registrar exitosamente la solicitud de verificación para una INSTITUCION", async () => {
      const instUser = await seedUser({ role: Role.INSTITUCION });
      const token = generateTestToken(instUser);

      const res = await request(app)
        .post("/api/users/institutional-verification")
        .set("Authorization", `Bearer ${token}`)
        .field("legalName", "Fundación Rescate Animal")
        .field("cuit", "30-11111111-8")
        .field("websiteUrl", "https://rescateanimal.org")
        .attach("documentFile", Buffer.from("dummy-pdf-content"), {
          filename: "constancia_cuit.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(VerificationStatus.PENDIENTE);
      expect(res.body.profileId).toBeDefined();
    });

    it("debe rechazar con 409 si el CUIT ya se encuentra registrado por otra institución", async () => {
      // Institución A ya tiene ese CUIT
      const userA = await seedUser({ role: Role.INSTITUCION });
      seedInstitutionalProfile(userA.id, { cuit: "30111111118" });

      // Institución B intenta registrar el mismo CUIT
      const userB = await seedUser({ role: Role.INSTITUCION });
      const tokenB = generateTestToken(userB);

      const res = await request(app)
        .post("/api/users/institutional-verification")
        .set("Authorization", `Bearer ${tokenB}`)
        .field("legalName", "Otra Institución")
        .field("cuit", "30-11111111-8");

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("El CUIT ingresado ya se encuentra registrado");
    });
  });

  describe("GET /api/users/institutional-status", () => {
    it("debe responder con 404 si la institución no ha iniciado trámite", async () => {
      const instUser = await seedUser({ role: Role.INSTITUCION });
      const token = generateTestToken(instUser);

      const res = await request(app)
        .get("/api/users/institutional-status")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("debe devolver los datos y estado del trámite si ya fue presentado", async () => {
      const instUser = await seedUser({ role: Role.INSTITUCION });
      seedInstitutionalProfile(instUser.id, {
        legalName: "Refugio Patitas",
        cuit: "30111111118",
        verificationStatus: VerificationStatus.PENDIENTE,
      });
      const token = generateTestToken(instUser);

      const res = await request(app)
        .get("/api/users/institutional-status")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.legalName).toBe("Refugio Patitas");
      expect(res.body.cuit).toBe("30111111118");
      expect(res.body.verificationStatus).toBe(VerificationStatus.PENDIENTE);
    });
  });
});

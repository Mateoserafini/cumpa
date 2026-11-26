import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import {
  Role,
  VerificationStatus,
  ReportTargetType,
  ReportReason,
  ReportReviewStatus,
  AnimalStatus,
} from "@prisma/client";
import {
  seedUser,
  seedAnimal,
  seedInstitutionalProfile,
  seedReport,
  generateTestToken,
} from "./helpers";
import { db } from "./mockDb";

describe("Admin & Moderation Integration Tests (/api/admin)", () => {
  let adminUser: any;
  let adminToken: string;
  let regularUser: any;
  let regularToken: string;

  beforeEach(async () => {
    adminUser = await seedUser({ role: Role.ADMIN, name: "Admin General" });
    adminToken = generateTestToken(adminUser);

    regularUser = await seedUser({ role: Role.PARTICULAR, name: "Usuario Común" });
    regularToken = generateTestToken(regularUser);
  });

  describe("Control de Acceso y RBAC", () => {
    it("debe rechazar con 401 si no hay token de autenticación en rutas de administración", async () => {
      const res = await request(app).get("/api/admin/stats");
      expect(res.status).toBe(401);
    });

    it("debe responder con 403 Forbidden si un usuario no administrador intenta acceder a la gestión de admin", async () => {
      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("ADMIN");
    });
  });

  describe("POST /api/admin/reports (Radicar Denuncias Ciudadanas)", () => {
    it("debe permitir a cualquier usuario autenticado denunciar una publicación de animal", async () => {
      const publisher = await seedUser();
      const animal = seedAnimal(publisher.id, { name: "Cachorro Sospechoso" });

      const res = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({
          targetType: ReportTargetType.ANIMAL,
          targetId: animal.id,
          reason: ReportReason.DATOS_FALSOS,
          description: "La publicación parece ser una estafa o venta encubierta.",
        });

      expect(res.status).toBe(201);
      expect(res.body.reportId).toBeDefined();
      expect(res.body.message).toContain("denuncia ha sido radicada");

      const created = db.reports.find((r) => r.id === res.body.reportId);
      expect(created).toBeDefined();
      expect(created?.status).toBe(ReportReviewStatus.PENDIENTE);
    });

    it("debe rechazar con 404 si el objetivo denunciado no existe", async () => {
      const res = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({
          targetType: ReportTargetType.ANIMAL,
          targetId: "00000000-0000-0000-0000-000000000000",
          reason: ReportReason.MALTRATO,
          description: "Descripción de prueba.",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("no existe");
    });

    it("[Wrong/Edge] debe rechazar denuncia con descripción < 15 chars (400), auto-denuncia (400) y objetivos dados de baja (404)", async () => {
      const targetUser = await seedUser({ name: "Usuario Denunciado" });
      const deletedAnimal = seedAnimal(targetUser.id, { name: "Ya Borrado" });
      const inDbAnimal = db.animals.find((a) => a.id === deletedAnimal.id);
      if (inDbAnimal) inDbAnimal.deletedAt = new Date();

      // Descripción corta
      const shortDesc = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({
          targetType: ReportTargetType.USER,
          targetId: targetUser.id,
          reason: ReportReason.SPAM,
          description: "Muy corta",
        });
      expect(shortDesc.status).toBe(400);

      // Auto-denuncia
      const selfReport = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({
          targetType: ReportTargetType.USER,
          targetId: regularUser.id,
          reason: ReportReason.OTRO,
          description: "Intento de radicar una denuncia sobre mi propia cuenta.",
        });
      expect(selfReport.status).toBe(400);

      // Animal dado de baja lógicamente
      const deletedTarget = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({
          targetType: ReportTargetType.ANIMAL,
          targetId: deletedAnimal.id,
          reason: ReportReason.ESTAFA,
          description: "Intento de denunciar una publicación ya eliminada.",
        });
      expect(deletedTarget.status).toBe(404);

      // Denuncia válida contra usuario activo
      const validUserReport = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({
          targetType: ReportTargetType.USER,
          targetId: targetUser.id,
          reason: ReportReason.ESTAFA,
          description: "Este usuario solicitó transferencias de dinero a cambio de entregas.",
        });
      expect(validUserReport.status).toBe(201);
    });
  });

  describe("GET /api/admin/institutions/pending y PATCH /api/admin/institutions/:id/verify", () => {
    it("debe listar las instituciones pendientes de auditoría y permitir su aprobación formal", async () => {
      const instUser = await seedUser({ role: Role.INSTITUCION });
      const profile = seedInstitutionalProfile(instUser.id, {
        legalName: "Refugio Los Amigos",
        cuit: "30111111118",
        verificationStatus: VerificationStatus.PENDIENTE,
      });

      // 1. Listar pendientes
      const listRes = await request(app)
        .get("/api/admin/institutions/pending")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.some((p: any) => p.id === profile.id)).toBe(true);

      // 2. Dictaminar aprobación
      const verifyRes = await request(app)
        .patch(`/api/admin/institutions/${profile.id}/verify`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: VerificationStatus.APROBADA,
          notes: "Constancia de CUIT y personería verificada correctamente.",
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.newStatus).toBe(VerificationStatus.APROBADA);

      const updated = db.institutionalProfiles.find((p) => p.id === profile.id);
      expect(updated?.verificationStatus).toBe(VerificationStatus.APROBADA);
      expect(updated?.verifiedByAdminId).toBe(adminUser.id);
    });
  });

  describe("GET /api/admin/reports y PATCH /api/admin/reports/:id/resolve", () => {
    it("debe listar denuncias y resolver una aplicando baja del animal (DELETE_ANIMAL)", async () => {
      const publisher = await seedUser();
      const animal = seedAnimal(publisher.id);
      const report = seedReport(regularUser.id, {
        targetType: ReportTargetType.ANIMAL,
        targetId: animal.id,
        reason: ReportReason.ESTAFA,
      });

      // Listar
      const listRes = await request(app)
        .get("/api/admin/reports")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.total).toBeGreaterThanOrEqual(1);

      // Resolver con acción sancionatoria
      const resolveRes = await request(app)
        .patch(`/api/admin/reports/${report.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: ReportReviewStatus.RESUELTO,
          resolutionNotes: "Publicación fraudulenta confirmada. Se da de baja la ficha.",
          takeAction: "DELETE_ANIMAL",
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.status).toBe(ReportReviewStatus.RESUELTO);

      const updatedReport = db.reports.find((r) => r.id === report.id);
      expect(updatedReport?.status).toBe(ReportReviewStatus.RESUELTO);
      expect(updatedReport?.resolvedByAdminId).toBe(adminUser.id);

      const deletedAnimal = db.animals.find((a) => a.id === animal.id);
      expect(deletedAnimal?.deletedAt).not.toBeNull();
    });

    it("[Security/Wrong] debe impedir sancionar denuncias DESESTIMADAS (400), aplicar DELETE_ANIMAL a USER (400), banear ADMIN (400), re-resolver (409) e invalidar JWT tras BAN_USER", async () => {
      const badUser = await seedUser({ role: Role.PARTICULAR, name: "Infractor" });
      const badUserToken = generateTestToken(badUser);

      const userReport = seedReport(regularUser.id, {
        targetType: ReportTargetType.USER,
        targetId: badUser.id,
        reason: ReportReason.ESTAFA,
      });

      // Desestimada con sanción -> 400
      const dismissWithAction = await request(app)
        .patch(`/api/admin/reports/${userReport.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: ReportReviewStatus.DESESTIMADO,
          resolutionNotes: "Sin pruebas suficientes para proceder con la sanción.",
          takeAction: "BAN_USER",
        });
      expect(dismissWithAction.status).toBe(400);

      // DELETE_ANIMAL sobre reporte de tipo USER -> 400
      const wrongAction = await request(app)
        .patch(`/api/admin/reports/${userReport.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: ReportReviewStatus.RESUELTO,
          resolutionNotes: "Se confirma la infracción reportada contra el usuario.",
          takeAction: "DELETE_ANIMAL",
        });
      expect(wrongAction.status).toBe(400);

      // BAN_USER válido
      const banRes = await request(app)
        .patch(`/api/admin/reports/${userReport.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: ReportReviewStatus.RESUELTO,
          resolutionNotes: "Se confirma estafa reiterada y se da de baja la cuenta.",
          takeAction: "BAN_USER",
        });
      expect(banRes.status).toBe(200);

      // El JWT del usuario baneado queda inválido inmediatamente (401)
      const meAfterBan = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${badUserToken}`);
      expect(meAfterBan.status).toBe(401);

      // Re-resolver denuncia ya resuelta -> 409
      const doubleResolve = await request(app)
        .patch(`/api/admin/reports/${userReport.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: ReportReviewStatus.DESESTIMADO,
          resolutionNotes: "Intento de cambiar dictamen de denuncia ya resuelta.",
        });
      expect(doubleResolve.status).toBe(409);

      // No se puede banear a un ADMIN -> 400
      const adminReport = seedReport(regularUser.id, {
        targetType: ReportTargetType.USER,
        targetId: adminUser.id,
        reason: ReportReason.OTRO,
      });
      const banAdminRes = await request(app)
        .patch(`/api/admin/reports/${adminReport.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: ReportReviewStatus.RESUELTO,
          resolutionNotes: "Intento de dar de baja a una cuenta administradora.",
          takeAction: "BAN_USER",
        });
      expect(banAdminRes.status).toBe(400);
    });
  });

  describe("GET /api/admin/stats (Métricas de Plataforma)", () => {
    it("debe devolver las métricas globales calculadas correctamente", async () => {
      // Sembrar datos para estadísticas
      const publisher = await seedUser();
      seedAnimal(publisher.id, { status: AnimalStatus.DISPONIBLE });
      seedAnimal(publisher.id, { status: AnimalStatus.ADOPTADO });

      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalUsers");
      expect(res.body).toHaveProperty("totalActiveAnimals");
      expect(res.body).toHaveProperty("totalAdoptionsCompleted");
      expect(res.body).toHaveProperty("activeFollowUps");
      expect(res.body).toHaveProperty("complianceRatePercentage");
      expect(res.body.totalUsers).toBeGreaterThanOrEqual(3);
    });
  });
});

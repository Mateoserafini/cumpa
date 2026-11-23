import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { Role, ReportStatus } from "@prisma/client";
import { seedUser, seedAnimal, generateTestToken } from "./helpers";
import { db } from "./mockDb";

describe("FollowUp Monthly Reports Integration Tests (/api/followups)", () => {
  let guardian: any;
  let guardianToken: string;
  let adopter: any;
  let adopterToken: string;
  let otherUser: any;
  let otherToken: string;
  let animal: any;
  let followUpId: string;

  beforeEach(async () => {
    // 1. Crear actores
    guardian = await seedUser({ name: "Tutor Rescatista", role: Role.PARTICULAR });
    guardianToken = generateTestToken(guardian);

    adopter = await seedUser({ name: "Adoptante Responsable", role: Role.PARTICULAR });
    adopterToken = generateTestToken(adopter);

    otherUser = await seedUser({ name: "Usuario Invasor", role: Role.PARTICULAR });
    otherToken = generateTestToken(otherUser);

    animal = seedAnimal(guardian.id, { name: "Simba" });

    // 2. Postulación y aprobación para originar el expediente de 6 meses
    const applyRes = await request(app)
      .post("/api/contacts/apply")
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({
        animalId: animal.id,
        type: "ADOPCION_DEFINITIVA",
        message: "Quiero adoptarlo y tengo casa con patio.",
        phone: "1122334455",
        hasOtherPets: false,
        hasYard: true,
      });

    const requestId = applyRes.body.requestId;

    const approveRes = await request(app)
      .patch(`/api/contacts/${requestId}/status`)
      .set("Authorization", `Bearer ${guardianToken}`)
      .send({ status: "APROBADA" });

    followUpId = approveRes.body.followUpId;
  });

  describe("POST /api/followups/:followUpId/report/:monthNumber", () => {
    it("debe rechazar la entrega con 401 si no hay token", async () => {
      const res = await request(app)
        .post(`/api/followups/${followUpId}/report/1`)
        .field("notes", "Todo perfecto");

      expect(res.status).toBe(401);
    });

    it("debe rechazar con 403 si un usuario ajeno intenta subir el reporte", async () => {
      const res = await request(app)
        .post(`/api/followups/${followUpId}/report/1`)
        .set("Authorization", `Bearer ${otherToken}`)
        .field("notes", "Intento no autorizado");

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Solo el adoptante responsable");
    });

    it("debe rechazar con 400 si el adoptante no adjunta la fotografía obligatoria", async () => {
      const res = await request(app)
        .post(`/api/followups/${followUpId}/report/1`)
        .set("Authorization", `Bearer ${adopterToken}`)
        .field("notes", "No tengo foto ahora");

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Debe adjuntar la fotografía");
    });

    it("debe permitir al adoptante entregar el reporte del Mes 1 con fotografía y notas", async () => {
      const res = await request(app)
        .post(`/api/followups/${followUpId}/report/1`)
        .set("Authorization", `Bearer ${adopterToken}`)
        .field("notes", "Simba está adaptándose bárbaro y jugando en el patio.")
        .attach("image", Buffer.from("dummy-image-bytes"), {
          filename: "simba_mes_1.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(200);
      expect(res.body.monthNumber).toBe(1);
      expect(res.body.status).toBe(ReportStatus.CUMPLIDO);
      expect(res.body.reportId).toBeDefined();

      const report = db.followUpReports.find(
        (r) => r.followUpId === followUpId && r.monthNumber === 1
      );
      expect(report?.status).toBe(ReportStatus.CUMPLIDO);
      expect(report?.submittedAt).toBeDefined();
      expect(report?.imageUrl).toBeDefined();
    });

    it("debe rechazar con 409 si se intenta entregar un mes que ya fue cumplido", async () => {
      // Primera entrega
      await request(app)
        .post(`/api/followups/${followUpId}/report/1`)
        .set("Authorization", `Bearer ${adopterToken}`)
        .attach("image", Buffer.from("dummy-image"), {
          filename: "foto.jpg",
          contentType: "image/jpeg",
        });

      // Segundo intento sobre el mismo mes
      const duplicateRes = await request(app)
        .post(`/api/followups/${followUpId}/report/1`)
        .set("Authorization", `Bearer ${adopterToken}`)
        .attach("image", Buffer.from("dummy-image-2"), {
          filename: "foto2.jpg",
          contentType: "image/jpeg",
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.message).toContain("ya fue entregado");
    });
  });

  describe("PATCH /api/followups/report/:reportId/review", () => {
    it("debe rechazar con 409 si el tutor intenta revisar un reporte que aún no fue entregado", async () => {
      const pendingReport = db.followUpReports.find(
        (r) => r.followUpId === followUpId && r.monthNumber === 2
      );

      const res = await request(app)
        .patch(`/api/followups/report/${pendingReport?.id}/review`)
        .set("Authorization", `Bearer ${guardianToken}`)
        .send({
          reviewedByGuardian: true,
          guardianFeedback: "Todo bien",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("todavía no entregó este reporte");
    });

    it("debe permitir al tutor rescatista registrar su conformidad y feedback tras la entrega", async () => {
      // 1. Adoptante entrega reporte
      const submitRes = await request(app)
        .post(`/api/followups/${followUpId}/report/1`)
        .set("Authorization", `Bearer ${adopterToken}`)
        .attach("image", Buffer.from("dummy-image"), {
          filename: "foto.jpg",
          contentType: "image/jpeg",
        });

      const reportId = submitRes.body.reportId;

      // 2. Tutor revisa y deja conformidad
      const reviewRes = await request(app)
        .patch(`/api/followups/report/${reportId}/review`)
        .set("Authorization", `Bearer ${guardianToken}`)
        .send({
          reviewedByGuardian: true,
          guardianFeedback: "¡Excelente estado de salud! Se lo ve hermoso.",
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.report.reviewedByGuardian).toBe(true);
      expect(reviewRes.body.report.guardianFeedback).toContain("Excelente estado");
    });
  });
});


import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../app";
import { FollowUpStatus, ReportStatus } from "@prisma/client";
import { seedUser, seedAnimal } from "./helpers";
import { db } from "./mockDb";
import emailService from "../modules/notifications/email.service";

const TEST_CRON_SECRET = "super_secret_cron_key_for_tests_123456";

function seedFollowUpWithReport(params: {
  animalId: string;
  adopterId: string;
  guardianId: string;
  followUpStatus?: FollowUpStatus;
  reportStatus?: ReportStatus;
  dueDate: Date;
  reminderSentAt?: Date | null;
  deletedAt?: Date | null;
}) {
  const followUpId = crypto.randomUUID();
  const reportId = crypto.randomUUID();
  const now = new Date();

  db.followUps.push({
    id: followUpId,
    animalId: params.animalId,
    adopterId: params.adopterId,
    guardianId: params.guardianId,
    startDate: now,
    endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
    durationMonths: 6,
    status: params.followUpStatus ?? FollowUpStatus.ACTIVO,
    createdAt: now,
    updatedAt: now,
    deletedAt: params.deletedAt ?? null,
  });

  db.followUpReports.push({
    id: reportId,
    followUpId,
    monthNumber: 1,
    dueDate: params.dueDate,
    submittedAt: null,
    imageUrl: null,
    imagePublicId: null,
    notes: null,
    status: params.reportStatus ?? ReportStatus.PENDIENTE,
    reminderSentAt: params.reminderSentAt ?? null,
    alertSentAt: null,
    reviewedByGuardian: false,
    guardianFeedback: null,
    createdAt: now,
    updatedAt: now,
  });

  return { followUpId, reportId };
}

describe("Vercel Cron Jobs Integration Tests (/api/cron)", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = TEST_CRON_SECRET;
  });

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
    vi.restoreAllMocks();
  });

  describe("Autenticación con CRON_SECRET (Wrong Paths & Edge Cases)", () => {
    it("[Wrong] debe rechazar con 401 si no se envía header Authorization o el secreto es incorrecto", async () => {
      const noHeader = await request(app).get("/api/cron/followup-reminders");
      expect(noHeader.status).toBe(401);

      const wrongSecret = await request(app)
        .get("/api/cron/nightly-maintenance")
        .set("Authorization", "Bearer secreto-incorrecto");
      expect(wrongSecret.status).toBe(401);
    });

    it("[Edge] debe responder 503 si CRON_SECRET no está configurado o conserva el valor placeholder de .env.example", async () => {
      delete process.env.CRON_SECRET;

      const resMissing = await request(app)
        .get("/api/cron/followup-reminders")
        .set("Authorization", `Bearer ${TEST_CRON_SECRET}`);

      expect(resMissing.status).toBe(503);
      expect(resMissing.body.message).toContain("CRON_SECRET");

      process.env.CRON_SECRET = "genera_una_clave_secreta_aleatoria_segura";
      const resPlaceholder = await request(app)
        .get("/api/cron/followup-reminders")
        .set("Authorization", "Bearer genera_una_clave_secreta_aleatoria_segura");

      expect(resPlaceholder.status).toBe(503);
    });

    it("[Wrong] debe rechazar prefijo Authorization distinto de Bearer y aceptar alias /cron/*", async () => {
      const badPrefix = await request(app)
        .get("/cron/followup-reminders")
        .set("Authorization", `Basic ${TEST_CRON_SECRET}`);
      expect(badPrefix.status).toBe(401);

      const aliasOk = await request(app)
        .get("/cron/followup-reminders")
        .set("Authorization", `Bearer ${TEST_CRON_SECRET}`);
      expect(aliasOk.status).toBe(200);
      expect(aliasOk.body.ok).toBe(true);
    });
  });

  describe("GET /api/cron/followup-reminders (Cron 1 — 09:00 AR / 12:00 UTC)", () => {
    it("[Happy/Edge] debe enviar recordatorios solo a reportes PENDIENTE próximos a vencer (<= 3 días) y no repetir si ya fue enviado", async () => {
      const guardian = await seedUser({ name: "Tutor" });
      const adopter = await seedUser({ name: "Adoptante", email: "adoptante@cron.test" });
      const animal1 = seedAnimal(guardian.id, { name: "Luna" });
      const animal2 = seedAnimal(guardian.id, { name: "Max" });
      const animal3 = seedAnimal(guardian.id, { name: "Toby" });

      const now = Date.now();
      const in2Days = new Date(now + 2 * 24 * 60 * 60 * 1000);
      const in10Days = new Date(now + 10 * 24 * 60 * 60 * 1000);

      // Debe dispararse: vence en 2 días y sin reminderSentAt
      const target = seedFollowUpWithReport({
        animalId: animal1.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        dueDate: in2Days,
      });

      // No debe dispararse: ya tiene reminderSentAt
      seedFollowUpWithReport({
        animalId: animal2.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        dueDate: in2Days,
        reminderSentAt: new Date(now - 3600_000),
      });

      // No debe dispararse: vence en 10 días (fuera de ventana de 3 días)
      seedFollowUpWithReport({
        animalId: animal3.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        dueDate: in10Days,
      });

      const emailSpy = vi
        .spyOn(emailService, "sendFollowUpReminderEmail")
        .mockResolvedValue({ id: "mock-rem-1", success: true });

      const res = await request(app)
        .get("/api/cron/followup-reminders")
        .set("Authorization", `Bearer ${TEST_CRON_SECRET}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.remindersSent).toBe(1);
      expect(res.body.failed).toBe(0);
      expect(emailSpy).toHaveBeenCalledTimes(1);

      const updatedReport = db.followUpReports.find((r) => r.id === target.reportId);
      expect(updatedReport?.reminderSentAt).not.toBeNull();
    });

    it("[Edge] si no hay reportes próximos a vencer responde 200 con remindersSent=0", async () => {
      const res = await request(app)
        .get("/api/cron/followup-reminders")
        .set("Authorization", `Bearer ${TEST_CRON_SECRET}`);

      expect(res.status).toBe(200);
      expect(res.body.remindersSent).toBe(0);
    });

    it("[Edge/Partial Failure] ante fallo parcial de SMTP solo marca reminderSentAt en el envío exitoso y omite expedientes eliminados o completados", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const guardian = await seedUser({ name: "Tutor" });
      const adopter = await seedUser({ name: "Adoptante", email: "adopter@partial.test" });
      const animalOk = seedAnimal(guardian.id, { name: "Kira" });
      const animalFail = seedAnimal(guardian.id, { name: "Milo" });
      const animalDeleted = seedAnimal(guardian.id, { name: "Borrado" });
      const animalCompleted = seedAnimal(guardian.id, { name: "Completado" });

      const in1Day = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const okTarget = seedFollowUpWithReport({
        animalId: animalOk.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        dueDate: in1Day,
      });
      const failTarget = seedFollowUpWithReport({
        animalId: animalFail.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        dueDate: in1Day,
      });
      // No debe dispararse: followUp dado de baja lógicamente
      seedFollowUpWithReport({
        animalId: animalDeleted.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        dueDate: in1Day,
        deletedAt: new Date(),
      });
      // No debe dispararse: followUp ya COMPLETADO
      seedFollowUpWithReport({
        animalId: animalCompleted.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        followUpStatus: FollowUpStatus.COMPLETADO,
        dueDate: in1Day,
      });

      vi.spyOn(emailService, "sendFollowUpReminderEmail")
        .mockResolvedValueOnce({ id: "mock-ok", success: true })
        .mockResolvedValueOnce({ id: "failed-1", success: false, error: "SMTP timeout" });

      const res = await request(app)
        .get("/api/cron/followup-reminders")
        .set("Authorization", `Bearer ${TEST_CRON_SECRET}`);

      expect(res.status).toBe(200);
      expect(res.body.remindersSent).toBe(1);
      expect(res.body.failed).toBe(1);

      expect(db.followUpReports.find((r) => r.id === okTarget.reportId)?.reminderSentAt).not.toBeNull();
      expect(db.followUpReports.find((r) => r.id === failTarget.reportId)?.reminderSentAt).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("GET /api/cron/nightly-maintenance (Cron 2 — 00:05 AR / 03:05 UTC)", () => {
    it("[Happy/Edge] debe marcar mora inicial (ATRASADO/EN_MORA), escalar mora >14 días (INCUMPLIDO/ALERTA_DISPARADA) y limpiar solo tokens expirados", async () => {
      const guardian = await seedUser({ name: "Refugio", email: "refugio@cron.test" });
      const adopter = await seedUser({ name: "Adoptante Mora" });
      const animalMora = seedAnimal(guardian.id, { name: "Boby" });
      const animalCritico = seedAnimal(guardian.id, { name: "Rocco" });

      const now = Date.now();
      const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
      const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000);

      // Caso 1: PENDIENTE vencido hace 2 días -> ATRASADO / EN_MORA
      const mora = seedFollowUpWithReport({
        animalId: animalMora.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        followUpStatus: FollowUpStatus.ACTIVO,
        reportStatus: ReportStatus.PENDIENTE,
        dueDate: twoDaysAgo,
      });

      // Caso 2: ATRASADO vencido hace 20 días -> INCUMPLIDO / ALERTA_DISPARADA
      const critico = seedFollowUpWithReport({
        animalId: animalCritico.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        followUpStatus: FollowUpStatus.EN_MORA,
        reportStatus: ReportStatus.ATRASADO,
        dueDate: twentyDaysAgo,
      });

      // Caso 3: Tokens de reset (uno expirado, uno vigente)
      const userExpiredToken = await seedUser({
        resetPasswordToken: "expired-tok",
        resetPasswordExpires: new Date(now - 60_000),
      });
      const userValidToken = await seedUser({
        resetPasswordToken: "valid-tok",
        resetPasswordExpires: new Date(now + 3600_000),
      });

      const alertSpy = vi
        .spyOn(emailService, "sendFollowUpAlertEmail")
        .mockResolvedValue({ id: "mock-alert", success: true });
      const criticalSpy = vi
        .spyOn(emailService, "sendFollowUpBreachCriticalEmail")
        .mockResolvedValue({ id: "mock-crit", success: true });

      const res = await request(app)
        .get("/api/cron/nightly-maintenance")
        .set("Authorization", `Bearer ${TEST_CRON_SECRET}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.breachAlert).toEqual({
        overdueMarked: 1,
        criticalEscalated: 1,
        failed: 0,
      });
      expect(res.body.tokenCleanup).toEqual({ tokensCleaned: 1 });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(criticalSpy).toHaveBeenCalledTimes(1);

      expect(db.followUpReports.find((r) => r.id === mora.reportId)?.status).toBe(ReportStatus.ATRASADO);
      expect(db.followUps.find((f) => f.id === mora.followUpId)?.status).toBe(FollowUpStatus.EN_MORA);

      expect(db.followUpReports.find((r) => r.id === critico.reportId)?.status).toBe(ReportStatus.INCUMPLIDO);
      expect(db.followUps.find((f) => f.id === critico.followUpId)?.status).toBe(
        FollowUpStatus.ALERTA_DISPARADA
      );

      expect(db.users.find((u) => u.id === userExpiredToken.id)?.resetPasswordToken).toBeNull();
      expect(db.users.find((u) => u.id === userValidToken.id)?.resetPasswordToken).toBe("valid-tok");
    });

    it("[Regression/Edge] no debe degradar un FollowUp en ALERTA_DISPARADA a EN_MORA cuando vence un reporte posterior, y debe contabilizar fallos SMTP e ignorar expedientes eliminados", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const guardian = await seedUser({ name: "Refugio", email: "refugio@alert.test" });
      const adopter = await seedUser({ name: "Adoptante" });
      const animalAlert = seedAnimal(guardian.id, { name: "Toby" });
      const animalDeleted = seedAnimal(guardian.id, { name: "Eliminado" });

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // FollowUp ya en ALERTA_DISPARADA con un segundo reporte PENDIENTE recién vencido
      const existingAlert = seedFollowUpWithReport({
        animalId: animalAlert.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        followUpStatus: FollowUpStatus.ALERTA_DISPARADA,
        reportStatus: ReportStatus.PENDIENTE,
        dueDate: twoDaysAgo,
      });

      // FollowUp dado de baja lógicamente -> debe ignorarse
      const deletedFu = seedFollowUpWithReport({
        animalId: animalDeleted.id,
        adopterId: adopter.id,
        guardianId: guardian.id,
        followUpStatus: FollowUpStatus.ACTIVO,
        reportStatus: ReportStatus.PENDIENTE,
        dueDate: twoDaysAgo,
        deletedAt: new Date(),
      });

      vi.spyOn(emailService, "sendFollowUpAlertEmail").mockResolvedValue({
        id: "failed-alert",
        success: false,
        error: "SMTP auth error",
      });

      const res = await request(app)
        .get("/api/cron/nightly-maintenance")
        .set("Authorization", `Bearer ${TEST_CRON_SECRET}`);

      expect(res.status).toBe(200);
      expect(res.body.breachAlert).toEqual({
        overdueMarked: 1,
        criticalEscalated: 0,
        failed: 1,
      });

      // El reporte pasó a ATRASADO pero el FollowUp mantuvo ALERTA_DISPARADA (sin downgrade!)
      expect(db.followUpReports.find((r) => r.id === existingAlert.reportId)?.status).toBe(
        ReportStatus.ATRASADO
      );
      expect(db.followUps.find((f) => f.id === existingAlert.followUpId)?.status).toBe(
        FollowUpStatus.ALERTA_DISPARADA
      );

      // El FollowUp eliminado no fue tocado
      expect(db.followUpReports.find((r) => r.id === deletedFu.reportId)?.status).toBe(
        ReportStatus.PENDIENTE
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

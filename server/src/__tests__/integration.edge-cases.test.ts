import { describe, it, expect } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../app";
import {
  Role,
  Species,
  Sex,
  Size,
  AgeCategory,
  Modality,
  AnimalStatus,
  VerificationStatus,
  ReportTargetType,
  ReportReason,
} from "@prisma/client";
import { seedUser, seedAnimal, seedInstitutionalProfile, generateTestToken } from "./helpers";
import { db } from "./mockDb";

describe("Integration Tests — Domain Happy Paths, Wrong Paths & Edge Cases", () => {
  describe("Auth — Recuperación de contraseña y verificación (Edge & Wrong Paths)", () => {
    it("[Edge] forgot-password debe responder 200 neutro incluso si el email no existe (anti-enumeración)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "no-existe@cumpa.org" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it("[Wrong] verify-email y reset-password deben responder 400 con tokens inválidos o expirados", async () => {
      const resVerify = await request(app).get("/api/auth/verify-email/token-inexistente-123");
      expect(resVerify.status).toBe(400);

      await seedUser({
        email: "expirado@test.com",
        resetPasswordToken: "expired-token-xyz",
        resetPasswordExpires: new Date(Date.now() - 60_000),
      });

      const resReset = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "expired-token-xyz", newPassword: "NuevaPassword123!" });

      expect(resReset.status).toBe(400);
    });

    it("[Happy/Edge] reset-password exitoso debe desbloquear un usuario previamente bloqueado por rate limiting (429)", async () => {
      const user = await seedUser({
        email: "desbloqueo@test.com",
        resetPasswordToken: "valid-reset-token-123",
        resetPasswordExpires: new Date(Date.now() + 3600_000),
      });

      // Provocar 3 intentos fallidos para activar bloqueo 429
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/auth/login")
          .send({ email: user.email, password: "WrongPassword!" });
      }

      const blockedRes = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "Password123!" });
      expect(blockedRes.status).toBe(429);

      // Restablecer contraseña limpia el rate limiter
      const resetRes = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "valid-reset-token-123", newPassword: "NuevaPassword123!" });
      expect(resetRes.status).toBe(200);

      // Ahora el login con la nueva contraseña debe funcionar
      const loginOk = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "NuevaPassword123!" });
      expect(loginOk.status).toBe(200);
      expect(loginOk.body.token).toBeDefined();
    });
  });

  describe("Animals — Filtros, permisos de publicación y soft-delete", () => {
    it("[Happy] debe filtrar correctamente el catálogo por especie, tamaño y provincia", async () => {
      const pub = await seedUser();
      seedAnimal(pub.id, {
        name: "Toby",
        species: Species.PERRO,
        size: Size.GRANDE,
        province: "Córdoba",
      });
      seedAnimal(pub.id, {
        name: "Mishi",
        species: Species.GATO,
        size: Size.CHICO,
        province: "Buenos Aires",
      });

      const res = await request(app).get("/api/animals?species=GATO&size=CHICO&province=Buenos%20Aires");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Mishi");
    });

    it("[Wrong] una institución con verificación PENDIENTE no puede publicar animales (403)", async () => {
      const inst = await seedUser({ role: Role.INSTITUCION });
      seedInstitutionalProfile(inst.id, { verificationStatus: VerificationStatus.PENDIENTE });
      const token = generateTestToken(inst);

      const res = await request(app)
        .post("/api/animals")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Rocky")
        .field("species", Species.PERRO)
        .field("sex", Sex.MACHO)
        .field("size", Size.MEDIANO)
        .field("ageCategory", AgeCategory.CACHORRO)
        .field("description", "Cachorro rescatado buscando hogar amoroso.")
        .field("modality", Modality.ADOPCION_DEFINITIVA)
        .field("province", "Mendoza")
        .field("city", "Godoy Cruz");

      expect(res.status).toBe(403);
    });

    it("[Wrong/Edge] un tercero no puede editar ni eliminar una publicación ajena (403) y el soft-delete oculta el animal (404)", async () => {
      const owner = await seedUser();
      const stranger = await seedUser();
      const animal = seedAnimal(owner.id, { name: "Nala" });

      const strangerToken = generateTestToken(stranger);
      const ownerToken = generateTestToken(owner);

      const resUpdateForbidden = await request(app)
        .put(`/api/animals/${animal.id}`)
        .set("Authorization", `Bearer ${strangerToken}`)
        .send({ name: "Hackeado" });
      expect(resUpdateForbidden.status).toBe(403);

      const resDeleteForbidden = await request(app)
        .delete(`/api/animals/${animal.id}`)
        .set("Authorization", `Bearer ${strangerToken}`);
      expect(resDeleteForbidden.status).toBe(403);

      const resDeleteOk = await request(app)
        .delete(`/api/animals/${animal.id}`)
        .set("Authorization", `Bearer ${ownerToken}`);
      expect(resDeleteOk.status).toBe(200);

      const resGetDeleted = await request(app).get(`/api/animals/${animal.id}`);
      expect(resGetDeleted.status).toBe(404);
    });
  });

  describe("Contacts & FollowUps — Reglas de negocio y bordes críticos", () => {
    it("[Wrong] debe impedir auto-postulación (400), modalidad incompatible (400), doble postulación (409) y animal ya adoptado (400)", async () => {
      const owner = await seedUser();
      const applicant = await seedUser();
      const animal = seedAnimal(owner.id, { modality: Modality.ADOPCION_DEFINITIVA });
      const adoptedAnimal = seedAnimal(owner.id, { status: AnimalStatus.ADOPTADO });

      const ownerToken = generateTestToken(owner);
      const applicantToken = generateTestToken(applicant);

      const basePayload = {
        animalId: animal.id,
        type: Modality.ADOPCION_DEFINITIVA,
        message: "Tengo experiencia cuidando perros rescatados y mucho espacio.",
        phone: "1144556677",
        hasOtherPets: false,
        hasYard: true,
      };

      // Auto-postulación
      const selfApply = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send(basePayload);
      expect(selfApply.status).toBe(400);

      // Modalidad incompatible
      const wrongModality = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${applicantToken}`)
        .send({ ...basePayload, type: Modality.TRANSITO });
      expect(wrongModality.status).toBe(400);

      // Primera postulación válida
      const firstApply = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${applicantToken}`)
        .send(basePayload);
      expect(firstApply.status).toBe(201);

      // Doble postulación activa
      const duplicateApply = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${applicantToken}`)
        .send(basePayload);
      expect(duplicateApply.status).toBe(409);

      // Postulación a animal ya adoptado
      const adoptedApply = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${applicantToken}`)
        .send({ ...basePayload, animalId: adoptedAnimal.id });
      expect(adoptedApply.status).toBe(400);
    });

    it("[Edge] aprobar una postulación cancela las demás pendientes, crea 6 reportes y bloquea acceso de terceros al FollowUp", async () => {
      const owner = await seedUser();
      const applicant1 = await seedUser({ name: "Postulante Uno" });
      const applicant2 = await seedUser({ name: "Postulante Dos" });
      const stranger = await seedUser({ name: "Ajeno" });
      const animal = seedAnimal(owner.id, { name: "Kira" });

      const apply1 = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${generateTestToken(applicant1)}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Quiero adoptar a Kira y cumplir los 6 meses de seguimiento.",
          phone: "1122334455",
          hasOtherPets: false,
          hasYard: true,
        });
      expect(apply1.status).toBe(201);

      const apply2 = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${generateTestToken(applicant2)}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "También me gustaría postularme para adoptar a Kira.",
          phone: "1199887766",
          hasOtherPets: true,
          hasYard: true,
        });
      expect(apply2.status).toBe(201);

      // Aprobar la primera
      const approveRes = await request(app)
        .patch(`/api/contacts/${apply1.body.requestId}/status`)
        .set("Authorization", `Bearer ${generateTestToken(owner)}`)
        .send({ status: "APROBADA" });
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.followUpCreated).toBe(true);
      expect(approveRes.body.followUpId).toBeDefined();

      // La segunda debe quedar CANCELADA automáticamente
      const secondReq = db.adoptionRequests.find((r) => r.id === apply2.body.requestId);
      expect(secondReq?.status).toBe("CANCELADA");

      // Deben haberse creado exactamente 6 reportes mensuales
      const reports = db.followUpReports.filter((r) => r.followUpId === approveRes.body.followUpId);
      expect(reports).toHaveLength(6);

      // Un tercero no involucrado no puede ver el expediente
      const forbiddenDetail = await request(app)
        .get(`/api/followups/${approveRes.body.followUpId}`)
        .set("Authorization", `Bearer ${generateTestToken(stranger)}`);
      expect(forbiddenDetail.status).toBe(403);

      // Mes fuera de rango (mes 7) debe ser rechazado con 400
      const invalidMonth = await request(app)
        .post(`/api/followups/${approveRes.body.followUpId}/report/7`)
        .set("Authorization", `Bearer ${generateTestToken(applicant1)}`)
        .attach("image", Buffer.from("fake-img"), "foto.jpg");
      expect(invalidMonth.status).toBe(400);
    });
  });

  describe("Admin & Denuncias — Control de acceso y validación de objetivo", () => {
    it("[Happy/Wrong] usuario común puede radicar denuncia válida (201), falla si el objetivo no existe (404) y no puede ver /admin/stats (403)", async () => {
      const reporter = await seedUser({ role: Role.PARTICULAR });
      const owner = await seedUser();
      const animal = seedAnimal(owner.id);
      const token = generateTestToken(reporter);

      const okReport = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          targetType: ReportTargetType.ANIMAL,
          targetId: animal.id,
          reason: ReportReason.DATOS_FALSOS,
          description: "Las fotos no corresponden al animal publicado.",
        });
      expect(okReport.status).toBe(201);

      const missingTarget = await request(app)
        .post("/api/admin/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          targetType: ReportTargetType.ANIMAL,
          targetId: crypto.randomUUID(),
          reason: ReportReason.SPAM,
          description: "Denuncia sobre un ID que no existe en base de datos.",
        });
      expect(missingTarget.status).toBe(404);

      const forbiddenStats = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(forbiddenStats.status).toBe(403);
    });
  });
});

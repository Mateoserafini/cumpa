import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, resetMockDb } from "./mockDb";
import { seedUser, seedAnimal, generateTestToken } from "./helpers";
import {
  Modality,
  AnimalStatus,
  RequestStatus,
  FollowUpStatus,
  ReportStatus,
} from "@prisma/client";

describe("Contacts & Followups Integration Tests (/api/contacts & /api/followups)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  describe("POST /api/contacts/apply (Postulación a adopción)", () => {
    it("debe rechazar la postulación con 401 si el usuario no está autenticado", async () => {
      const response = await request(app)
        .post("/api/contacts/apply")
        .send({
          animalId: "b7e415ef-96cb-4b2a-8991-628f80459c5d",
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Mensaje de prueba de más de veinte caracteres.",
          phone: "1122334455",
          hasOtherPets: false,
          hasYard: true,
        });

      expect(response.status).toBe(401);
    });

    it("debe permitir postularse exitosamente a un animal DISPONIBLE", async () => {
      const publisher = await seedUser({ name: "Rescatista Juan" });
      const adopter = await seedUser({ name: "Adoptante María" });
      const animal = seedAnimal(publisher.id, {
        name: "Clifford",
        status: AnimalStatus.DISPONIBLE,
        modality: Modality.ADOPCION_DEFINITIVA,
      });

      const token = generateTestToken(adopter);

      const payload = {
        animalId: animal.id,
        type: Modality.ADOPCION_DEFINITIVA,
        message: "Hola! Tenemos una casa con patio cerrado y mucho amor para brindarle a Clifford.",
        phone: "1155667788",
        hasOtherPets: false,
        hasYard: true,
        housingType: "Casa",
      };

      const response = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("requestId");
      expect(response.body.status).toBe(RequestStatus.PENDIENTE);
      expect(response.body.message).toMatch(/enviada exitosamente/i);

      // Verificar persistencia en base de datos
      const reqInDb = db.adoptionRequests.find((r) => r.id === response.body.requestId);
      expect(reqInDb).toBeDefined();
      expect(reqInDb?.applicantId).toBe(adopter.id);
      expect(reqInDb?.animalId).toBe(animal.id);
    });

    it("debe impedir que el publicador se postule a un animal publicado por su propia cuenta", async () => {
      const publisher = await seedUser({ name: "Tutor Propietario" });
      const animal = seedAnimal(publisher.id);
      const token = generateTestToken(publisher);

      const response = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${token}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Intento postularme a mi propio animal publicado.",
          phone: "1199887766",
          hasOtherPets: false,
          hasYard: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tu propia cuenta/i);
    });

    it("debe responder con 409 si el adoptante ya tiene una postulación activa para ese mismo animal", async () => {
      const publisher = await seedUser();
      const adopter = await seedUser();
      const animal = seedAnimal(publisher.id);
      const token = generateTestToken(adopter);

      // Primera postulación
      await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${token}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Primera postulación válida con más de veinte caracteres requeridos.",
          phone: "1144332211",
          hasOtherPets: false,
          hasYard: true,
        });

      // Segunda postulación duplicada
      const duplicateResponse = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${token}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Segunda postulación para el mismo animal con texto diferente.",
          phone: "1144332211",
          hasOtherPets: false,
          hasYard: true,
        });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.message).toMatch(/ya cuentas con una postulación activa/i);
    });
  });

  describe("PATCH /api/contacts/:id/status (Aprobación y expediente de seguimiento de 6 meses)", () => {
    it("debe rechazar con 403 si un usuario ajeno intenta resolver la postulación", async () => {
      const publisher = await seedUser({ name: "Publicador Legítimo" });
      const stranger = await seedUser({ name: "Usuario Ajeno" });
      const adopter = await seedUser();
      const animal = seedAnimal(publisher.id);

      // Postulación creada
      const postulation = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${generateTestToken(adopter)}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Mensaje extenso de postulación para ser evaluado.",
          phone: "1122334455",
          hasOtherPets: false,
          hasYard: true,
        });

      const response = await request(app)
        .patch(`/api/contacts/${postulation.body.requestId}/status`)
        .set("Authorization", `Bearer ${generateTestToken(stranger)}`)
        .send({ status: RequestStatus.APROBADA });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/no tiene permisos para gestionar/i);
    });

    it("al aprobar una postulación debe adjudicar el animal, cancelar las demás y crear un FollowUp de 6 meses con 6 reportes", async () => {
      const publisher = await seedUser({ name: "Tutor Rescatista" });
      const winnerAdopter = await seedUser({ name: "Adoptante Ganador" });
      const otherAdopter = await seedUser({ name: "Otro Postulante" });

      const animal = seedAnimal(publisher.id, {
        name: "Milo",
        status: AnimalStatus.DISPONIBLE,
        modality: Modality.ADOPCION_DEFINITIVA,
      });

      // Postulación 1 (Ganadora)
      const resWinner = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${generateTestToken(winnerAdopter)}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Nos encanta Milo y queremos adoptarlo definitivamente en familia.",
          phone: "1188990011",
          hasOtherPets: true,
          hasYard: true,
        });

      // Postulación 2 (Será cancelada automáticamente)
      const resOther = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${generateTestToken(otherAdopter)}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "También me gustaría postularme para adoptar a Milo.",
          phone: "1177665544",
          hasOtherPets: false,
          hasYard: false,
        });

      const publisherToken = generateTestToken(publisher);

      // El publicador aprueba la postulación ganadora
      const approvalResponse = await request(app)
        .patch(`/api/contacts/${resWinner.body.requestId}/status`)
        .set("Authorization", `Bearer ${publisherToken}`)
        .send({ status: RequestStatus.APROBADA });

      expect(approvalResponse.status).toBe(200);
      expect(approvalResponse.body.message).toMatch(/actualizado a APROBADA/i);
      expect(approvalResponse.body.followUpCreated).toBe(true);

      // Verificar estado de la postulación ganadora (pasa a APROBADA)
      const updatedWinnerReq = db.adoptionRequests.find((r) => r.id === resWinner.body.requestId);
      expect(updatedWinnerReq?.status).toBe(RequestStatus.APROBADA);

      // 1. Verificar estado del animal (pasa a ADOPTADO)
      const updatedAnimal = db.animals.find((a) => a.id === animal.id);
      expect(updatedAnimal?.status).toBe(AnimalStatus.ADOPTADO);

      // 2. Verificar que la otra postulación fue cancelada
      const updatedOtherReq = db.adoptionRequests.find((r) => r.id === resOther.body.requestId);
      expect(updatedOtherReq?.status).toBe(RequestStatus.CANCELADA);

      // 3. Verificar expediente FollowUp de 6 meses
      const followUp = db.followUps.find((f) => f.animalId === animal.id);
      expect(followUp).toBeDefined();
      expect(followUp?.status).toBe(FollowUpStatus.ACTIVO);
      expect(followUp?.durationMonths).toBe(6);
      expect(followUp?.adopterId).toBe(winnerAdopter.id);
      expect(followUp?.guardianId).toBe(publisher.id);

      // 4. Verificar exactamente 6 FollowUpReport generados con estados PENDIENTE
      const reports = db.followUpReports.filter((r) => r.followUpId === followUp?.id);
      expect(reports).toHaveLength(6);
      expect(reports.map((r) => r.monthNumber).sort()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(reports.every((r) => r.status === ReportStatus.PENDIENTE)).toBe(true);
    });

    it("el adoptante debe poder consultar su expediente y cronograma a través de /api/followups/as-adopter", async () => {
      const publisher = await seedUser();
      const adopter = await seedUser();
      const animal = seedAnimal(publisher.id);

      // Crear postulación y aprobar
      const applyRes = await request(app)
        .post("/api/contacts/apply")
        .set("Authorization", `Bearer ${generateTestToken(adopter)}`)
        .send({
          animalId: animal.id,
          type: Modality.ADOPCION_DEFINITIVA,
          message: "Postulación para adopción para consultar el seguimiento luego.",
          phone: "1155443322",
          hasOtherPets: false,
          hasYard: true,
        });

      await request(app)
        .patch(`/api/contacts/${applyRes.body.requestId}/status`)
        .set("Authorization", `Bearer ${generateTestToken(publisher)}`)
        .send({ status: RequestStatus.APROBADA });

      // Consultar como adoptante
      const followUpResponse = await request(app)
        .get("/api/followups/as-adopter")
        .set("Authorization", `Bearer ${generateTestToken(adopter)}`);

      expect(followUpResponse.status).toBe(200);
      expect(followUpResponse.body).toHaveLength(1);
      expect(followUpResponse.body[0].durationMonths).toBe(6);
      expect(followUpResponse.body[0].reports).toHaveLength(6);
    });
  });
});

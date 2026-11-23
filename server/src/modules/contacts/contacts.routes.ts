import { Router } from "express";
import contactsController from "./contacts.controller";
import {
  submitApplicationValidation,
  updateApplicationStatusValidation,
  animalApplicationsParamValidation,
} from "./contacts.validation";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth.middleware";

const router = Router();

// Postularse para adopción o tránsito (usuario autenticado)
router.post(
  "/apply",
  authenticateToken,
  submitApplicationValidation,
  validateRequest,
  contactsController.submitApplication
);

// Historial de postulaciones emitidas por el adoptante
router.get("/my-applications", authenticateToken, contactsController.getMyApplications);

// Bandeja de postulaciones recibidas para un animal publicado (solo publicador o admin)
router.get(
  "/animal/:animalId",
  authenticateToken,
  animalApplicationsParamValidation,
  validateRequest,
  contactsController.getApplicationsByAnimal
);

// Dictamen y resolución de una postulación
router.patch(
  "/:id/status",
  authenticateToken,
  updateApplicationStatusValidation,
  validateRequest,
  contactsController.updateApplicationStatus
);

export default router;

import { Router } from "express";
import followUpsController from "./followups.controller";
import {
  getFollowUpByIdValidation,
  submitReportValidation,
  reviewReportValidation,
} from "./followups.validation";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { upload } from "../../config/cloudinary.config";

const router = Router();

// Listado de seguimientos donde soy adoptante
router.get("/as-adopter", authenticateToken, followUpsController.getAsAdopter);

// Listado de seguimientos donde soy tutor publicador
router.get("/as-guardian", authenticateToken, followUpsController.getAsGuardian);

// Detalle del expediente y cronograma de 6 meses
router.get(
  "/:id",
  authenticateToken,
  getFollowUpByIdValidation,
  validateRequest,
  followUpsController.getFollowUpById
);

// Carga obligatoria del reporte fotográfico mensual por parte del adoptante
router.post(
  "/:followUpId/report/:monthNumber",
  authenticateToken,
  upload.single("image"),
  submitReportValidation,
  validateRequest,
  followUpsController.submitMonthlyReport
);

// Revisión y conformidad por parte del tutor rescatista
router.patch(
  "/report/:reportId/review",
  authenticateToken,
  reviewReportValidation,
  validateRequest,
  followUpsController.reviewReport
);

export default router;

import { Router } from "express";
import adminController from "./admin.controller";
import {
  verifyInstitutionValidation,
  createReportValidation,
  resolveReportValidation,
  getReportsValidation,
} from "./admin.validation";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/roles.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Radicar denuncia (cualquier usuario registrado)
router.post(
  "/reports",
  authenticateToken,
  createReportValidation,
  validateRequest,
  adminController.createReport
);

// Todas las rutas siguientes requieren rol ADMIN
router.use(authenticateToken, requireRoles(Role.ADMIN));

// Auditoría de personerías de instituciones y veterinarias
router.get("/institutions/pending", adminController.getPendingInstitutions);
router.patch(
  "/institutions/:id/verify",
  verifyInstitutionValidation,
  validateRequest,
  adminController.verifyInstitution
);

// Gestión y moderación de denuncias
router.get("/reports", getReportsValidation, validateRequest, adminController.getReports);
router.patch(
  "/reports/:id/resolve",
  resolveReportValidation,
  validateRequest,
  adminController.resolveReport
);

// Métricas de plataforma
router.get("/stats", adminController.getAdminStats);

export default router;

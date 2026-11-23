import { Router } from "express";
import usersController from "./users.controller";
import {
  updateProfileValidation,
  institutionalVerificationValidation,
} from "./users.validation";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/roles.middleware";
import { upload } from "../../config/cloudinary.config";
import { Role } from "@prisma/client";

const router = Router();

// Perfil de usuario (cualquier rol autenticado)
router.get("/profile", authenticateToken, usersController.getProfile);
router.put(
  "/profile",
  authenticateToken,
  updateProfileValidation,
  validateRequest,
  usersController.updateProfile
);

// Verificación institucional (solo INSTITUCION o VETERINARIA)
router.post(
  "/institutional-verification",
  authenticateToken,
  requireRoles(Role.INSTITUCION, Role.VETERINARIA),
  upload.single("documentFile"),
  institutionalVerificationValidation,
  validateRequest,
  usersController.submitInstitutionalVerification
);

router.get(
  "/institutional-status",
  authenticateToken,
  requireRoles(Role.INSTITUCION, Role.VETERINARIA),
  usersController.getInstitutionalStatus
);

export default router;

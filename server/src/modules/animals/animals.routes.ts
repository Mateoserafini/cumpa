import { Router } from "express";
import animalsController from "./animals.controller";
import {
  getAnimalsValidation,
  createAnimalValidation,
  updateAnimalValidation,
  updateAnimalStatusValidation,
} from "./animals.validation";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { requireVerifiedPublisher } from "../../middlewares/roles.middleware";
import { upload } from "../../config/cloudinary.config";

const router = Router();

// Catálogo público
router.get("/", getAnimalsValidation, validateRequest, animalsController.getAnimals);

// Mis publicaciones (privado) - DEBE ir antes de /:id para no ser interpretado como id
router.get("/my-publications", authenticateToken, animalsController.getMyPublications);

// Ficha técnica individual (público)
router.get("/:id", animalsController.getAnimalById);

// Publicar animal (privado - requiere cuenta particular o institucional verificada)
router.post(
  "/",
  authenticateToken,
  requireVerifiedPublisher,
  upload.array("images", 5),
  createAnimalValidation,
  validateRequest,
  animalsController.createAnimal
);

// Modificar publicación
router.put(
  "/:id",
  authenticateToken,
  updateAnimalValidation,
  validateRequest,
  animalsController.updateAnimal
);

// Modificar estado operativo
router.patch(
  "/:id/status",
  authenticateToken,
  updateAnimalStatusValidation,
  validateRequest,
  animalsController.updateStatus
);

// Baja lógica
router.delete("/:id", authenticateToken, animalsController.deleteAnimal);

export default router;

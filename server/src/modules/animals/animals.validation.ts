import { body, query, param } from "express-validator";
import { Species, Sex, Size, AgeCategory, Modality, AnimalStatus } from "@prisma/client";

export const getAnimalsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("species").optional().isIn(Object.values(Species)),
  query("sex").optional().isIn(Object.values(Sex)),
  query("size").optional().isIn(Object.values(Size)),
  query("ageCategory").optional().isIn(Object.values(AgeCategory)),
  query("modality").optional().isIn(Object.values(Modality)),
  query("province").optional().trim(),
  query("city").optional().trim(),
  query("search").optional().trim(),
];

export const createAnimalValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del animal es obligatorio.")
    .isLength({ min: 2, max: 60 })
    .withMessage("El nombre debe tener entre 2 y 60 caracteres."),
  body("species")
    .isIn(Object.values(Species))
    .withMessage("La especie debe ser PERRO, GATO u OTRO."),
  body("breed").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("sex")
    .isIn(Object.values(Sex))
    .withMessage("El sexo debe ser MACHO o HEMBRA."),
  body("size")
    .isIn(Object.values(Size))
    .withMessage("El tamaño debe ser CHICO, MEDIANO o GRANDE."),
  body("ageCategory")
    .isIn(Object.values(AgeCategory))
    .withMessage("La categoría de edad debe ser CACHORRO, JOVEN, ADULTO o SENIOR."),
  body("approximateAgeMonths")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 360 })
    .toInt()
    .withMessage("La edad aproximada en meses debe ser un número válido."),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción de la personalidad y necesidades es obligatoria.")
    .isLength({ min: 20, max: 2000 })
    .withMessage("La descripción debe tener entre 20 y 2000 caracteres."),
  body("healthDetails").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  body("isNeutered")
    .optional()
    .toBoolean(),
  body("isVaccinated")
    .optional()
    .toBoolean(),
  body("isDewormed")
    .optional()
    .toBoolean(),
  body("specialNeeds")
    .optional()
    .toBoolean(),
  body("specialNeedsDescription").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  body("modality")
    .isIn(Object.values(Modality))
    .withMessage("La modalidad debe ser ADOPCION_DEFINITIVA, TRANSITO_TEMPORARIO o AMBAS."),
  body("province")
    .trim()
    .notEmpty()
    .withMessage("La provincia es obligatoria."),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("La localidad/ciudad es obligatoria."),
];

export const updateAnimalValidation = [
  param("id").isUUID().withMessage("El ID de la publicación no es válido."),
  body("name").optional().trim().isLength({ min: 2, max: 60 }),
  body("species").optional().isIn(Object.values(Species)),
  body("breed").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body("sex").optional().isIn(Object.values(Sex)),
  body("size").optional().isIn(Object.values(Size)),
  body("ageCategory").optional().isIn(Object.values(AgeCategory)),
  body("approximateAgeMonths").optional({ checkFalsy: true }).isInt({ min: 1, max: 360 }).toInt(),
  body("description").optional().trim().isLength({ min: 20, max: 2000 }),
  body("healthDetails").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  body("isNeutered").optional().toBoolean(),
  body("isVaccinated").optional().toBoolean(),
  body("isDewormed").optional().toBoolean(),
  body("specialNeeds").optional().toBoolean(),
  body("specialNeedsDescription").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  body("modality").optional().isIn(Object.values(Modality)),
  body("province").optional().trim().notEmpty(),
  body("city").optional().trim().notEmpty(),
];

export const updateAnimalStatusValidation = [
  param("id").isUUID().withMessage("El ID de la publicación no es válido."),
  body("status")
    .isIn([AnimalStatus.DISPONIBLE, AnimalStatus.EN_PROCESO, AnimalStatus.PAUSADA, AnimalStatus.CANCELADA])
    .withMessage("El estado debe ser DISPONIBLE, EN_PROCESO, PAUSADA o CANCELADA."),
];

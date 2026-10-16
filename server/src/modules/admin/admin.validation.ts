import { body, param, query } from "express-validator";
import { VerificationStatus, ReportReviewStatus, ReportTargetType, ReportReason } from "@prisma/client";

export const verifyInstitutionValidation = [
  param("id").isUUID().withMessage("El ID del perfil institucional debe ser un UUID válido."),
  body("status")
    .isIn([VerificationStatus.APROBADA, VerificationStatus.RECHAZADA])
    .withMessage("El estado debe ser APROBADA o RECHAZADA."),
  body("notes")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las notas no pueden superar los 1000 caracteres."),
];

export const createReportValidation = [
  body("targetType")
    .isIn(Object.values(ReportTargetType))
    .withMessage("El tipo de objetivo debe ser ANIMAL o USER."),
  body("targetId")
    .isUUID()
    .withMessage("El targetId debe ser un UUID válido."),
  body("reason")
    .isIn(Object.values(ReportReason))
    .withMessage("El motivo debe ser DATOS_FALSOS, MALTRATO, ESTAFA, SPAM u OTRO."),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Debe detallar el motivo de la denuncia.")
    .isLength({ min: 15, max: 2000 })
    .withMessage("La descripción debe tener entre 15 y 2000 caracteres."),
];

export const resolveReportValidation = [
  param("id").isUUID().withMessage("El ID de la denuncia debe ser un UUID válido."),
  body("status")
    .isIn([ReportReviewStatus.RESUELTO, ReportReviewStatus.DESESTIMADO])
    .withMessage("El dictamen debe ser RESUELTO o DESESTIMADO."),
  body("resolutionNotes")
    .trim()
    .notEmpty()
    .withMessage("Debe incluir las notas o fundamentación de resolución.")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Las notas deben contener al menos 10 caracteres."),
  body("takeAction")
    .optional()
    .isIn(["BAN_USER", "DELETE_ANIMAL", "NONE"])
    .withMessage("La acción correctiva debe ser BAN_USER, DELETE_ANIMAL o NONE."),
];

export const getReportsValidation = [
  query("status").optional().isIn(Object.values(ReportReviewStatus)),
  query("targetType").optional().isIn(Object.values(ReportTargetType)),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
];

import { body, param } from "express-validator";

export const getFollowUpByIdValidation = [
  param("id").isUUID().withMessage("El ID de seguimiento debe ser un UUID válido."),
];

export const submitReportValidation = [
  param("followUpId").isUUID().withMessage("El ID de seguimiento debe ser un UUID válido."),
  param("monthNumber")
    .isInt({ min: 1, max: 6 })
    .toInt()
    .withMessage("El número de mes debe estar entre 1 y 6."),
  body("notes")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Las notas no pueden exceder los 1500 caracteres."),
];

export const reviewReportValidation = [
  param("reportId").isUUID().withMessage("El ID del reporte debe ser un UUID válido."),
  body("reviewedByGuardian")
    .isBoolean()
    .toBoolean()
    .withMessage("Debe indicar si el reporte fue revisado."),
  body("guardianFeedback")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("El feedback del tutor no puede superar los 1000 caracteres."),
];

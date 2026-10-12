import { body, param } from "express-validator";
import { Modality, RequestStatus } from "@prisma/client";

export const submitApplicationValidation = [
  body("animalId")
    .isUUID()
    .withMessage("El ID del animal debe ser un UUID válido."),
  body("type")
    .isIn([Modality.ADOPCION_DEFINITIVA, Modality.TRANSITO_TEMPORARIO])
    .withMessage("El tipo debe ser ADOPCION_DEFINITIVA o TRANSITO_TEMPORARIO."),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Debe incluir un mensaje explicando su motivación y condiciones del hogar.")
    .isLength({ min: 20, max: 2000 })
    .withMessage("El mensaje debe contener entre 20 y 2000 caracteres."),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("El teléfono de contacto es obligatorio.")
    .isLength({ min: 6, max: 30 })
    .withMessage("El teléfono debe tener un formato válido."),
  body("address").optional({ checkFalsy: true }).trim().isLength({ max: 250 }),
  body("hasOtherPets").isBoolean().toBoolean().withMessage("Debe indicar si convive con otras mascotas."),
  body("hasYard").isBoolean().toBoolean().withMessage("Debe indicar si cuenta con patio o parque."),
  body("housingType").optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body("landlordAllowsPets").optional().isBoolean().toBoolean(),
];

export const updateApplicationStatusValidation = [
  param("id")
    .isUUID()
    .withMessage("El ID de la postulación debe ser un UUID válido."),
  body("status")
    .isIn([RequestStatus.EN_REVISION, RequestStatus.APROBADA, RequestStatus.RECHAZADA])
    .withMessage("El nuevo estado debe ser EN_REVISION, APROBADA o RECHAZADA."),
  body("rejectionReason")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("El motivo de rechazo no puede exceder los 500 caracteres."),
];

export const animalApplicationsParamValidation = [
  param("animalId")
    .isUUID()
    .withMessage("El ID del animal debe ser un UUID válido."),
];

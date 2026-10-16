import { body } from "express-validator";
import { isCuitValid } from "../../utils/cuitValidator";

export const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 6, max: 25 })
    .withMessage("El número de teléfono debe tener un formato válido."),
  body("province")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La provincia no puede estar vacía."),
  body("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La ciudad no puede estar vacía."),
  body("address")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("La dirección no puede superar los 200 caracteres."),
  body("avatarUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("El avatar debe ser una URL válida."),
];

export const institutionalVerificationValidation = [
  body("legalName")
    .trim()
    .notEmpty()
    .withMessage("La razón social o nombre legal es obligatorio.")
    .isLength({ min: 2, max: 150 })
    .withMessage("La razón social debe tener entre 2 y 150 caracteres."),
  body("cuit")
    .trim()
    .notEmpty()
    .withMessage("El CUIT es obligatorio.")
    .custom((cuit) => {
      if (!isCuitValid(cuit)) {
        throw new Error("El CUIT ingresado no es válido según el algoritmo oficial de AFIP (Módulo 11).");
      }
      return true;
    }),
  body("websiteUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("El sitio web debe ser una URL válida."),
  body("instagramUrl")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("El usuario o enlace de Instagram no es válido."),
];

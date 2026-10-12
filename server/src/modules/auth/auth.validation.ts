import { body, param } from "express-validator";
import { Role } from "@prisma/client";

export const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres.")
    .matches(/\d/)
    .withMessage("La contraseña debe contener al menos un número."),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre o razón social es obligatorio.")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
  body("role")
    .isIn([Role.PARTICULAR, Role.VETERINARIA, Role.INSTITUCION])
    .withMessage("El rol debe ser PARTICULAR, VETERINARIA o INSTITUCION."),
  body("province")
    .trim()
    .notEmpty()
    .withMessage("La provincia es obligatoria."),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("La localidad/ciudad es obligatoria."),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 6, max: 25 })
    .withMessage("El teléfono debe tener un formato válido."),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida."),
];

export const verifyEmailValidation = [
  param("token")
    .notEmpty()
    .withMessage("El token de verificación es obligatorio."),
];

export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
];

export const resendVerificationValidation = [
  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body("token")
    .notEmpty()
    .withMessage("El token de restablecimiento es obligatorio."),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("La nueva contraseña debe tener al menos 8 caracteres.")
    .matches(/\d/)
    .withMessage("La nueva contraseña debe contener al menos un número."),
];

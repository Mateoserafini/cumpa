import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { HttpError } from "./errorHandler.middleware";
import prisma from "../config/prisma";

/**
 * Middleware para restringir acceso por roles de usuario (RBAC).
 */
export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new HttpError(401, "No autenticado."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new HttpError(
          403,
          `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}.`
        )
      );
    }

    next();
  };
}

/**
 * Middleware para validar que una institución o veterinaria tenga personería jurídica APROBADA
 * antes de realizar acciones protegidas (como publicar animales).
 * Los particulares pueden publicar directamente.
 */
export async function requireVerifiedPublisher(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    return next(new HttpError(401, "No autenticado."));
  }

  // Si es PARTICULAR o ADMIN, puede publicar sin validación institucional
  if (req.user.role === Role.PARTICULAR || req.user.role === Role.ADMIN) {
    return next();
  }

  // Si es INSTITUCION o VETERINARIA, debe tener perfil institucional con estado APROBADA
  const profile = await prisma.institutionalProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!profile || profile.verificationStatus !== "APROBADA") {
    return next(
      new HttpError(
        403,
        "Su cuenta institucional requiere aprobación previa del CUIT y documentación para realizar esta acción."
      )
    );
  }

  next();
}

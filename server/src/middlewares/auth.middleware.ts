import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { getJwtSecret } from "../config/jwt";
import { HttpError } from "./errorHandler.middleware";
import { JwtUserPayload } from "../types";

/**
 * Verifica el JWT del header Authorization y carga el usuario activo en req.user.
 */
export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next(new HttpError(401, "Acceso no autorizado: Token no proporcionado."));
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtUserPayload;

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      select: { id: true, email: true, name: true, role: true, isEmailVerified: true },
    });

    if (!user) {
      return next(new HttpError(401, "Token inválido: Usuario no encontrado o inactivo."));
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new HttpError(401, "La sesión ha expirado. Inicie sesión nuevamente."));
    }
    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      return next(new HttpError(401, "Token de autenticación inválido."));
    }
    next(err);
  }
}

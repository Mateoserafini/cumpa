import { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Middleware centralizado de manejo de excepciones y errores HTTP
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Manejo de errores controlados del dominio
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Errores de subida de archivos (tamaño, campo inesperado, etc.)
  if (err.name === "MulterError") {
    res.status(400).json({ message: `Error al subir el archivo: ${err.message}` });
    return;
  }

  // Violación de unicidad en Prisma (ej: email duplicado por carrera o cuenta dada de baja)
  if (err.code === "P2002") {
    res.status(409).json({ message: "Ya existe un registro con esos datos únicos." });
    return;
  }

  // Manejo de errores de sintaxis JSON en el body
  if (err.type === "entity.parse.failed" || err.status === 400) {
    res.status(400).json({
      message: "Cuerpo de la petición JSON inválido.",
    });
    return;
  }

  // Error no controlado
  console.error("❌ Error no controlado en el servidor:", err);

  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Ocurrió un error interno en el servidor."
      : err.message || "Ocurrió un error interno en el servidor.";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {}),
  });
}

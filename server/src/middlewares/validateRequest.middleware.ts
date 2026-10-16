import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware que intercepta los errores acumulados por express-validator
 * y devuelve un status 400 uniforme.
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Errores de validación en la solicitud.",
      errors: errors.array().map((err) => ({
        field: "path" in err ? err.path : undefined,
        message: err.msg,
      })),
    });
    return;
  }
  next();
}

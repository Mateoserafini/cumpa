import crypto from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import { HttpError } from "../../middlewares/errorHandler.middleware";
import { runFollowUpReminderJob } from "../../jobs/followupReminder.job";
import { runFollowUpBreachAlertJob } from "../../jobs/followupBreachAlert.job";
import { runTokenCleanupJob } from "../../jobs/tokenCleanup.job";

const router = Router();

/**
 * Middleware de autenticación para endpoints invocados por Vercel Cron Jobs.
 * Vercel envía automáticamente `Authorization: Bearer <CRON_SECRET>` cuando la variable
 * CRON_SECRET está configurada en el proyecto.
 */
function verifyCronSecret(req: Request, _res: Response, next: NextFunction): void {
  const configuredSecret = process.env.CRON_SECRET?.trim();

  if (!configuredSecret) {
    return next(
      new HttpError(
        503,
        "CRON_SECRET no está configurado en el servidor. Configure la variable de entorno antes de habilitar Vercel Cron Jobs."
      )
    );
  }

  const authHeader = req.headers.authorization || "";
  const expectedHeader = `Bearer ${configuredSecret}`;

  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expectedHeader);

  if (
    authBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(authBuffer, expectedBuffer)
  ) {
    return next(new HttpError(401, "No autorizado para ejecutar tareas programadas."));
  }

  next();
}

router.use(verifyCronSecret);

/**
 * Cron 1 (Diario 09:00 hs AR / 12:00 UTC):
 * Recordatorios preventivos 3 días antes del vencimiento del reporte mensual.
 */
router.get("/followup-reminders", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runFollowUpReminderJob();
    res.status(200).json({
      ok: true,
      job: "followup-reminders",
      executedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Cron 2 (Diario 00:05 hs AR / 03:05 UTC):
 * Mantenimiento nocturno unificado (cumple límite de 2 crons diarios en Vercel Hobby):
 * - Detección de mora (ATRASADO / EN_MORA) y escalamiento crítico >14 días (INCUMPLIDO / ALERTA_DISPARADA)
 * - Limpieza de tokens de restablecimiento de contraseña expirados
 */
router.get("/nightly-maintenance", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const breachResult = await runFollowUpBreachAlertJob();
    const cleanupResult = await runTokenCleanupJob();

    res.status(200).json({
      ok: true,
      job: "nightly-maintenance",
      executedAt: new Date().toISOString(),
      breachAlert: breachResult,
      tokenCleanup: cleanupResult,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

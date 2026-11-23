import cron from "node-cron";
import prisma from "../config/prisma";

/**
 * Job semanal los domingos a las 03:00 hs:
 * Purgado de tokens de restablecimiento de contraseña expirados.
 */
export function startTokenCleanupJob(): void {
  cron.schedule("0 3 * * 0", async () => {
    console.log("⏰ [Cron] Ejecutando purgado semanal de tokens de recuperación expirados...");
    try {
      const result = await prisma.user.updateMany({
        where: {
          resetPasswordExpires: {
            lt: new Date(),
          },
        },
        data: {
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      console.log(`🧹 [Cron] Se limpiaron ${result.count} tokens expirados.`);
    } catch (error) {
      console.error("❌ [Cron] Error en job de limpieza de tokens:", error);
    }
  }, { timezone: "America/Argentina/Buenos_Aires" });
}

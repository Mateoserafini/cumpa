import cron from "node-cron";
import prisma from "../config/prisma";

export interface TokenCleanupJobResult {
  tokensCleaned: number;
}

/**
 * Ejecuta el purgado de tokens de restablecimiento de contraseña expirados.
 */
export async function runTokenCleanupJob(): Promise<TokenCleanupJobResult> {
  console.log("⏰ [Cron] Ejecutando purgado de tokens de recuperación expirados...");
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
  return { tokensCleaned: result.count };
}

/**
 * Job semanal los domingos a las 03:00 hs (America/Argentina/Buenos_Aires) para entornos con proceso persistente.
 */
export function startTokenCleanupJob(): void {
  cron.schedule(
    "0 3 * * 0",
    async () => {
      try {
        await runTokenCleanupJob();
      } catch (error) {
        console.error("❌ [Cron] Error en job de limpieza de tokens:", error);
      }
    },
    { timezone: "America/Argentina/Buenos_Aires" }
  );
}

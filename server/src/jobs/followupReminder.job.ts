import cron from "node-cron";
import prisma from "../config/prisma";
import emailService from "../modules/notifications/email.service";
import { ReportStatus } from "@prisma/client";

export interface FollowUpReminderJobResult {
  remindersSent: number;
  failed: number;
}

/**
 * Ejecuta el control diario de recordatorios preventivos de seguimiento
 * (3 días antes de la fecha límite mensual).
 */
export async function runFollowUpReminderJob(): Promise<FollowUpReminderJobResult> {
  console.log("⏰ [Cron] Ejecutando control diario de recordatorios preventivos de seguimiento...");
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const pendingReports = await prisma.followUpReport.findMany({
    where: {
      status: ReportStatus.PENDIENTE,
      reminderSentAt: null,
      dueDate: {
        gte: now,
        lte: inThreeDays,
      },
    },
    include: {
      followUp: {
        include: {
          adopter: { select: { email: true, name: true } },
          animal: { select: { name: true } },
        },
      },
    },
  });

  let remindersSent = 0;
  let failed = 0;

  for (const report of pendingReports) {
    try {
      const emailRes = await emailService.sendFollowUpReminderEmail(
        report.followUp.adopter.email,
        report.followUp.adopter.name,
        report.followUp.animal.name,
        report.monthNumber,
        report.dueDate
      );

      if (emailRes.success === false) {
        failed += 1;
        console.error(
          `❌ [Cron] Falló el envío de recordatorio para reporte ${report.id}:`,
          emailRes.error
        );
        continue;
      }

      await prisma.followUpReport.update({
        where: { id: report.id },
        data: { reminderSentAt: new Date() },
      });
      remindersSent += 1;
    } catch (error) {
      failed += 1;
      console.error(`❌ [Cron] Error procesando recordatorio del reporte ${report.id}:`, error);
    }
  }

  if (remindersSent > 0) {
    console.log(`✅ [Cron] Se despacharon ${remindersSent} recordatorios preventivos.`);
  }

  return { remindersSent, failed };
}

/**
 * Job diario a las 09:00 hs (America/Argentina/Buenos_Aires) para entornos con proceso persistente.
 */
export function startFollowUpReminderJob(): void {
  cron.schedule(
    "0 9 * * *",
    async () => {
      try {
        await runFollowUpReminderJob();
      } catch (error) {
        console.error("❌ [Cron] Error en job de recordatorios preventivos:", error);
      }
    },
    { timezone: "America/Argentina/Buenos_Aires" }
  );
}

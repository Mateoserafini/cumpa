import cron from "node-cron";
import prisma from "../config/prisma";
import emailService from "../modules/notifications/resend.service";
import { ReportStatus } from "@prisma/client";

/**
 * Job diario a las 09:00 hs:
 * Recordatorio preventivo 3 días antes de la fecha límite mensual de seguimiento.
 */
export function startFollowUpReminderJob(): void {
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ [Cron] Ejecutando control diario de recordatorios preventivos de seguimiento...");
    try {
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

      for (const report of pendingReports) {
        await emailService.sendFollowUpReminderEmail(
          report.followUp.adopter.email,
          report.followUp.adopter.name,
          report.followUp.animal.name,
          report.monthNumber,
          report.dueDate
        );

        await prisma.followUpReport.update({
          where: { id: report.id },
          data: { reminderSentAt: new Date() },
        });
      }

      if (pendingReports.length > 0) {
        console.log(`✅ [Cron] Se despacharon ${pendingReports.length} recordatorios preventivos.`);
      }
    } catch (error) {
      console.error("❌ [Cron] Error en job de recordatorios preventivos:", error);
    }
  }, { timezone: "America/Argentina/Buenos_Aires" });
}

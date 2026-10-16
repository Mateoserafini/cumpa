import cron from "node-cron";
import prisma from "../config/prisma";
import emailService from "../modules/notifications/resend.service";
import { ReportStatus, FollowUpStatus } from "@prisma/client";

/**
 * Job diario a las 00:05 hs:
 * 1. Detección de mora inicial: reportes vencidos (PENDIENTE con dueDate < hoy) -> pasan a ATRASADO,
 *    el expediente FollowUp pasa a EN_MORA y se despacha alerta al tutor rescatista.
 * 2. Escalamiento a incumplimiento grave: reportes atrasados por más de 14 días (ATRASADO con dueDate < hoy - 14 días) ->
 *    pasan a INCUMPLIDO, el expediente FollowUp escala a ALERTA_DISPARADA y se dispara intimación crítica.
 */
export function startFollowUpBreachAlertJob(): void {
  cron.schedule(
    "5 0 * * *",
    async () => {
      console.log("⏰ [Cron] Ejecutando control diario de mora y escalamiento de incumplimientos...");
      try {
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // 1. Detección de mora inicial (reportes que recién vencieron)
        const newlyOverdueReports = await prisma.followUpReport.findMany({
          where: {
            status: ReportStatus.PENDIENTE,
            dueDate: { lt: now },
          },
          include: {
            followUp: {
              include: {
                guardian: { select: { email: true, name: true } },
                adopter: { select: { name: true } },
                animal: { select: { name: true } },
              },
            },
          },
        });

        for (const report of newlyOverdueReports) {
          await prisma.followUpReport.update({
            where: { id: report.id },
            data: {
              status: ReportStatus.ATRASADO,
              alertSentAt: new Date(),
            },
          });

          // Pasa a EN_MORA si estaba ACTIVO
          await prisma.followUp.update({
            where: { id: report.followUpId },
            data: { status: FollowUpStatus.EN_MORA },
          });

          await emailService.sendFollowUpAlertEmail(
            report.followUp.guardian.email,
            report.followUp.guardian.name,
            report.followUp.animal.name,
            report.monthNumber,
            report.followUp.adopter.name
          );
        }

        // 2. Escalamiento crítico: reportes atrasados con más de 14 días sin regularizar
        const severelyOverdueReports = await prisma.followUpReport.findMany({
          where: {
            status: ReportStatus.ATRASADO,
            dueDate: { lt: fourteenDaysAgo },
          },
          include: {
            followUp: {
              include: {
                guardian: { select: { email: true, name: true } },
                adopter: { select: { name: true } },
                animal: { select: { name: true } },
              },
            },
          },
        });

        for (const report of severelyOverdueReports) {
          await prisma.followUpReport.update({
            where: { id: report.id },
            data: {
              status: ReportStatus.INCUMPLIDO,
            },
          });

          // Escalar expediente a ALERTA_DISPARADA
          await prisma.followUp.update({
            where: { id: report.followUpId },
            data: { status: FollowUpStatus.ALERTA_DISPARADA },
          });

          await emailService.sendFollowUpBreachCriticalEmail(
            report.followUp.guardian.email,
            report.followUp.guardian.name,
            report.followUp.animal.name,
            report.monthNumber,
            report.followUp.adopter.name
          );
        }

        if (newlyOverdueReports.length > 0 || severelyOverdueReports.length > 0) {
          console.log(
            `⚠️ [Cron] Procesados: ${newlyOverdueReports.length} reportes en mora (EN_MORA), ${severelyOverdueReports.length} reportes en mora grave (ALERTA_DISPARADA).`
          );
        }
      } catch (error) {
        console.error("❌ [Cron] Error en job de detección de mora y escalamiento:", error);
      }
    },
    { timezone: "America/Argentina/Buenos_Aires" }
  );
}

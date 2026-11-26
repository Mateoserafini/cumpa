import cron from "node-cron";
import prisma from "../config/prisma";
import emailService from "../modules/notifications/email.service";
import { ReportStatus, FollowUpStatus } from "@prisma/client";

export interface FollowUpBreachAlertJobResult {
  overdueMarked: number;
  criticalEscalated: number;
  failed: number;
}

/**
 * Ejecuta el control diario de mora y escalamiento de incumplimientos:
 * 1. Reportes PENDIENTE vencidos (dueDate < hoy) -> ATRASADO, FollowUp -> EN_MORA + alerta al tutor.
 * 2. Reportes ATRASADO > 14 días -> INCUMPLIDO, FollowUp -> ALERTA_DISPARADA + alerta crítica.
 */
export async function runFollowUpBreachAlertJob(): Promise<FollowUpBreachAlertJobResult> {
  console.log("⏰ [Cron] Ejecutando control diario de mora y escalamiento de incumplimientos...");
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let overdueMarked = 0;
  let criticalEscalated = 0;
  let failed = 0;

  // 1. Detección de mora inicial (reportes que recién vencieron)
  const newlyOverdueReports = await prisma.followUpReport.findMany({
    where: {
      status: ReportStatus.PENDIENTE,
      dueDate: { lt: now },
      followUp: {
        deletedAt: null,
        status: { not: FollowUpStatus.COMPLETADO },
      },
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
    try {
      await prisma.followUpReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.ATRASADO,
          alertSentAt: new Date(),
        },
      });

      // Solo pasa a EN_MORA si estaba ACTIVO (nunca degradar desde ALERTA_DISPARADA)
      if (report.followUp.status === FollowUpStatus.ACTIVO) {
        await prisma.followUp.update({
          where: { id: report.followUpId },
          data: { status: FollowUpStatus.EN_MORA },
        });
      }

      const emailRes = await emailService.sendFollowUpAlertEmail(
        report.followUp.guardian.email,
        report.followUp.guardian.name,
        report.followUp.animal.name,
        report.monthNumber,
        report.followUp.adopter.name
      );

      if (emailRes.success === false) {
        failed += 1;
        console.error(
          `❌ [Cron] Falló el envío de alerta de mora para reporte ${report.id}:`,
          emailRes.error
        );
      }

      overdueMarked += 1;
    } catch (error) {
      failed += 1;
      console.error(`❌ [Cron] Error procesando mora inicial del reporte ${report.id}:`, error);
    }
  }

  // 2. Escalamiento crítico: reportes atrasados con más de 14 días sin regularizar
  const severelyOverdueReports = await prisma.followUpReport.findMany({
    where: {
      status: ReportStatus.ATRASADO,
      dueDate: { lt: fourteenDaysAgo },
      followUp: {
        deletedAt: null,
        status: { not: FollowUpStatus.COMPLETADO },
      },
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
    try {
      await prisma.followUpReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.INCUMPLIDO,
        },
      });

      await prisma.followUp.update({
        where: { id: report.followUpId },
        data: { status: FollowUpStatus.ALERTA_DISPARADA },
      });

      const emailRes = await emailService.sendFollowUpBreachCriticalEmail(
        report.followUp.guardian.email,
        report.followUp.guardian.name,
        report.followUp.animal.name,
        report.monthNumber,
        report.followUp.adopter.name
      );

      if (emailRes.success === false) {
        failed += 1;
        console.error(
          `❌ [Cron] Falló el envío de alerta crítica para reporte ${report.id}:`,
          emailRes.error
        );
      }

      criticalEscalated += 1;
    } catch (error) {
      failed += 1;
      console.error(`❌ [Cron] Error escalando incumplimiento del reporte ${report.id}:`, error);
    }
  }

  if (overdueMarked > 0 || criticalEscalated > 0) {
    console.log(
      `⚠️ [Cron] Procesados: ${overdueMarked} reportes en mora (EN_MORA), ${criticalEscalated} reportes en mora grave (ALERTA_DISPARADA).`
    );
  }

  return { overdueMarked, criticalEscalated, failed };
}

/**
 * Job diario a las 00:05 hs (America/Argentina/Buenos_Aires) para entornos con proceso persistente.
 */
export function startFollowUpBreachAlertJob(): void {
  cron.schedule(
    "5 0 * * *",
    async () => {
      try {
        await runFollowUpBreachAlertJob();
      } catch (error) {
        console.error("❌ [Cron] Error en job de detección de mora y escalamiento:", error);
      }
    },
    { timezone: "America/Argentina/Buenos_Aires" }
  );
}

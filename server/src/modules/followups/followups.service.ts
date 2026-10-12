import prisma from "../../config/prisma";
import { HttpError } from "../../middlewares/errorHandler.middleware";
import { uploadToCloudinary } from "../../config/cloudinary.config";
import { Role, ReportStatus, FollowUpStatus } from "@prisma/client";

export class FollowUpsService {
  /**
   * Expedientes de seguimiento activos donde el usuario es el Adoptante responsable
   */
  async getAsAdopter(userId: string) {
    const followUps = await prisma.followUp.findMany({
      where: {
        adopterId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
        guardian: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        reports: {
          orderBy: { monthNumber: "asc" },
        },
      },
    });

    return followUps.map((item) => ({
      ...item,
      animal: {
        ...item.animal,
        mainImage: item.animal.images[0]?.url || null,
      },
    }));
  }

  /**
   * Expedientes de seguimiento donde el usuario es el Tutor/Rescatista supervisor
   */
  async getAsGuardian(userId: string) {
    const followUps = await prisma.followUp.findMany({
      where: {
        guardianId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
        adopter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            province: true,
          },
        },
        reports: {
          orderBy: { monthNumber: "asc" },
        },
      },
    });

    return followUps.map((item) => ({
      ...item,
      animal: {
        ...item.animal,
        mainImage: item.animal.images[0]?.url || null,
      },
    }));
  }

  /**
   * Detalle completo del expediente de seguimiento y sus 6 reportes mensuales
   */
  async getFollowUpById(followUpId: string, userId: string, userRole: Role) {
    const followUp = await prisma.followUp.findFirst({
      where: { id: followUpId, deletedAt: null },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            images: {
              orderBy: { order: "asc" },
            },
          },
        },
        adopter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            province: true,
            city: true,
            avatarUrl: true,
          },
        },
        guardian: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        reports: {
          orderBy: { monthNumber: "asc" },
        },
      },
    });

    if (!followUp) {
      throw new HttpError(404, "Expediente de seguimiento no encontrado.");
    }

    const isParticipant =
      followUp.adopterId === userId || followUp.guardianId === userId || userRole === Role.ADMIN;

    if (!isParticipant) {
      throw new HttpError(403, "No tiene permisos para acceder a este expediente de seguimiento.");
    }

    return followUp;
  }

  /**
   * Carga obligatoria del reporte fotográfico mensual por parte del Adoptante
   */
  async submitMonthlyReport(
    followUpId: string,
    monthNumber: number,
    userId: string,
    notes?: string,
    file?: Express.Multer.File
  ) {
    const followUp = await prisma.followUp.findFirst({
      where: { id: followUpId, deletedAt: null },
    });

    if (!followUp) {
      throw new HttpError(404, "Expediente de seguimiento no encontrado.");
    }

    if (followUp.adopterId !== userId) {
      throw new HttpError(403, "Solo el adoptante responsable puede entregar los reportes mensuales.");
    }

    const report = await prisma.followUpReport.findUnique({
      where: {
        followUpId_monthNumber: {
          followUpId,
          monthNumber,
        },
      },
    });

    if (!report) {
      throw new HttpError(404, `No se encontró el reporte correspondiente al mes ${monthNumber}.`);
    }

    if (report.status === ReportStatus.CUMPLIDO) {
      throw new HttpError(409, `El reporte del mes ${monthNumber} ya fue entregado.`);
    }

    if (!file) {
      throw new HttpError(400, "Debe adjuntar la fotografía del reporte mensual.");
    }

    const uploadRes = await uploadToCloudinary(file.buffer, "cumpa/seguimientos", file.originalname);
    const imageUrl = uploadRes.url;
    const imagePublicId = uploadRes.publicId;

    const updatedReport = await prisma.followUpReport.update({
      where: { id: report.id },
      data: {
        imageUrl,
        imagePublicId,
        notes: notes !== undefined ? notes : report.notes,
        submittedAt: new Date(),
        status: ReportStatus.CUMPLIDO,
      },
    });

    // Evaluar si todos los 6 reportes fueron cumplidos para cerrar el seguimiento
    const allReports = await prisma.followUpReport.findMany({
      where: { followUpId },
    });

    const allCompleted = allReports.every((r) => r.status === ReportStatus.CUMPLIDO);
    const hasOverdue = allReports.some(
      (r) => r.status === ReportStatus.ATRASADO || r.status === ReportStatus.INCUMPLIDO
    );
    const newStatus = allCompleted
      ? FollowUpStatus.COMPLETADO
      : hasOverdue
        ? followUp.status
        : FollowUpStatus.ACTIVO;

    if (newStatus !== followUp.status) {
      await prisma.followUp.update({
        where: { id: followUpId },
        data: { status: newStatus },
      });
    }

    return {
      message: `Reporte mensual del Mes ${monthNumber} entregado exitosamente.`,
      reportId: updatedReport.id,
      monthNumber: updatedReport.monthNumber,
      status: updatedReport.status,
      submittedAt: updatedReport.submittedAt,
    };
  }

  /**
   * Registro de conformidad o feedback por parte del Tutor/Rescatista
   */
  async reviewReport(
    reportId: string,
    userId: string,
    userRole: Role,
    reviewedByGuardian: boolean,
    guardianFeedback?: string
  ) {
    const report = await prisma.followUpReport.findUnique({
      where: { id: reportId },
      include: {
        followUp: true,
      },
    });

    if (!report) {
      throw new HttpError(404, "Reporte mensual no encontrado.");
    }

    if (report.followUp.guardianId !== userId && userRole !== Role.ADMIN) {
      throw new HttpError(403, "Solo el tutor rescatista puede revisar y dejar conformidad en este reporte.");
    }

    if (!report.submittedAt) {
      throw new HttpError(409, "El adoptante todavía no entregó este reporte mensual.");
    }

    const updated = await prisma.followUpReport.update({
      where: { id: reportId },
      data: {
        reviewedByGuardian,
        guardianFeedback: guardianFeedback ?? report.guardianFeedback,
      },
    });

    return {
      message: "Revisión del reporte registrada correctamente.",
      report: updated,
    };
  }
}

export const followUpsService = new FollowUpsService();
export default followUpsService;

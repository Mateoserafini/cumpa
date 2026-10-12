import prisma from "../../config/prisma";
import { HttpError } from "../../middlewares/errorHandler.middleware";
import emailService from "../notifications/resend.service";
import {
  Role,
  VerificationStatus,
  ReportReviewStatus,
  ReportTargetType,
  ReportReason,
  AnimalStatus,
  FollowUpStatus,
  ReportStatus,
  Prisma,
} from "@prisma/client";

export interface VerifyInstitutionInput {
  status: VerificationStatus;
  notes?: string;
}

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
}

export interface ResolveReportInput {
  status: ReportReviewStatus;
  resolutionNotes: string;
  takeAction?: "BAN_USER" | "DELETE_ANIMAL" | "NONE";
}

export class AdminService {
  /**
   * Listado de organizaciones con solicitud de CUIT pendiente de auditoría
   */
  async getPendingInstitutions() {
    const pending = await prisma.institutionalProfile.findMany({
      where: {
        verificationStatus: VerificationStatus.PENDIENTE,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            province: true,
            city: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return pending;
  }

  /**
   * Dictamen y resolución formal de verificación institucional
   */
  async verifyInstitution(institutionId: string, adminId: string, data: VerifyInstitutionInput) {
    const profile = await prisma.institutionalProfile.findUnique({
      where: { id: institutionId },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!profile) {
      throw new HttpError(404, "Perfil institucional no encontrado.");
    }

    const updated = await prisma.institutionalProfile.update({
      where: { id: institutionId },
      data: {
        verificationStatus: data.status,
        verificationNotes: data.notes,
        verifiedAt: new Date(),
        verifiedByAdminId: adminId,
      },
    });

    // Despacho de notificación oficial a la casilla de la institución
    emailService
      .sendInstitutionalVerificationNotice(
        profile.user.email,
        profile.legalName,
        data.status as "APROBADA" | "RECHAZADA",
        data.notes
      )
      .catch((err) => console.error("Error al notificar resolución institucional:", err));

    return {
      message: `Resolución institucional aplicada exitosamente (${data.status}).`,
      institutionId: updated.id,
      newStatus: updated.verificationStatus,
    };
  }

  /**
   * Creación de denuncia por parte de un usuario de la comunidad
   */
  async createReport(reporterId: string, data: CreateReportInput) {
    // Validar existencia del objetivo
    if (data.targetType === ReportTargetType.ANIMAL) {
      const animal = await prisma.animal.findUnique({ where: { id: data.targetId } });
      if (!animal) throw new HttpError(404, "El animal denunciado no existe.");
    } else if (data.targetType === ReportTargetType.USER) {
      const user = await prisma.user.findUnique({ where: { id: data.targetId } });
      if (!user) throw new HttpError(404, "El usuario denunciado no existe.");
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
        status: ReportReviewStatus.PENDIENTE,
      },
    });

    return {
      message: "Su denuncia ha sido radicada y será evaluada por el equipo de moderación.",
      reportId: report.id,
    };
  }

  /**
   * Cola de denuncias con filtros y paginación
   */
  async getReports(query: {
    status?: ReportReviewStatus;
    targetType?: ReportTargetType;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;

    const [total, reports] = await prisma.$transaction([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      data: reports,
    };
  }

  /**
   * Resolución de una denuncia por parte del Administrador
   */
  async resolveReport(reportId: string, adminId: string, data: ResolveReportInput) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new HttpError(404, "Denuncia no encontrada.");
    }

    if (report.status === ReportReviewStatus.RESUELTO || report.status === ReportReviewStatus.DESESTIMADO) {
      throw new HttpError(409, "La denuncia ya fue resuelta.");
    }

    if (data.status === ReportReviewStatus.DESESTIMADO && data.takeAction && data.takeAction !== "NONE") {
      throw new HttpError(400, "Una denuncia desestimada no puede aplicar sanciones.");
    }

    await prisma.$transaction(async (tx) => {
      // Aplicar acción sancionatoria si se solicitó
      if (data.takeAction === "BAN_USER") {
        const userId =
          report.targetType === ReportTargetType.USER
            ? report.targetId
            : (await tx.animal.findUnique({ where: { id: report.targetId } }))?.publisherId;

        const target = userId ? await tx.user.findUnique({ where: { id: userId } }) : null;
        if (target?.role === Role.ADMIN) {
          throw new HttpError(400, "No se puede dar de baja a un administrador.");
        }
        if (target) {
          await tx.user.update({
            where: { id: target.id },
            data: { deletedAt: new Date() },
          });
        }
      } else if (data.takeAction === "DELETE_ANIMAL" && report.targetType === ReportTargetType.ANIMAL) {
        await tx.animal.update({
          where: { id: report.targetId },
          data: { deletedAt: new Date() },
        });
      }

      // Marcar reporte
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: data.status,
          resolutionNotes: data.resolutionNotes,
          resolvedByAdminId: adminId,
          resolvedAt: new Date(),
        },
      });
    });

    return {
      message: `Denuncia gestionada exitosamente (${data.status}).`,
      reportId,
      status: data.status,
    };
  }

  /**
   * Métricas cuantitativas globales de la plataforma
   */
  async getAdminStats() {
    const [
      totalUsers,
      totalActiveAnimals,
      totalAdoptionsCompleted,
      activeFollowUps,
      totalReports,
      submittedMonthlyReports,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.animal.count({
        where: {
          deletedAt: null,
          status: { in: [AnimalStatus.DISPONIBLE, AnimalStatus.EN_PROCESO] },
        },
      }),
      prisma.animal.count({
        where: {
          deletedAt: null,
          status: AnimalStatus.ADOPTADO,
        },
      }),
      prisma.followUp.count({
        where: {
          deletedAt: null,
          status: { in: [FollowUpStatus.ACTIVO, FollowUpStatus.EN_MORA, FollowUpStatus.ALERTA_DISPARADA] },
        },
      }),
      prisma.followUpReport.count({
        where: {
          status: { in: [ReportStatus.CUMPLIDO, ReportStatus.ATRASADO, ReportStatus.INCUMPLIDO] },
        },
      }),
      prisma.followUpReport.count({
        where: { status: ReportStatus.CUMPLIDO },
      }),
    ]);

    // Solo se consideran reportes ya exigibles (entregados o vencidos), no los futuros pendientes
    const complianceRatePercentage =
      totalReports > 0 ? Math.round((submittedMonthlyReports / totalReports) * 100) : 100;

    return {
      totalUsers,
      totalActiveAnimals,
      totalAdoptionsCompleted,
      activeFollowUps,
      complianceRatePercentage,
    };
  }
}

export const adminService = new AdminService();
export default adminService;

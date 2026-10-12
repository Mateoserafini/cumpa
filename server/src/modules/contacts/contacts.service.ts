import prisma from "../../config/prisma";
import { HttpError } from "../../middlewares/errorHandler.middleware";
import emailService from "../notifications/resend.service";
import {
  Modality,
  RequestStatus,
  AnimalStatus,
  FollowUpStatus,
  ReportStatus,
  Role,
} from "@prisma/client";

export interface SubmitApplicationInput {
  animalId: string;
  type: Modality;
  message: string;
  phone: string;
  address?: string;
  hasOtherPets: boolean;
  hasYard: boolean;
  housingType?: string;
  landlordAllowsPets?: boolean;
}

export interface UpdateApplicationStatusInput {
  status: RequestStatus;
  rejectionReason?: string;
}

export class ContactsService {
  /**
   * Registro y persistencia de postulación de adopción/tránsito
   */
  async submitApplication(applicantId: string, data: SubmitApplicationInput) {
    const animal = await prisma.animal.findFirst({
      where: { id: data.animalId, deletedAt: null },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!animal) {
      throw new HttpError(404, "El animal seleccionado no existe o ya no está disponible.");
    }

    if (animal.status !== AnimalStatus.DISPONIBLE && animal.status !== AnimalStatus.EN_PROCESO) {
      throw new HttpError(400, "Esta publicación ya no se encuentra recibiendo nuevas postulaciones.");
    }

    if (animal.publisherId === applicantId) {
      throw new HttpError(400, "No puedes postularte para un animal publicado por tu propia cuenta.");
    }

    if (animal.modality !== Modality.AMBAS && animal.modality !== data.type) {
      throw new HttpError(400, `Este animal solo se ofrece en modalidad ${animal.modality}.`);
    }

    // Verificar si ya tiene una postulación activa
    const existingApplication = await prisma.adoptionRequest.findFirst({
      where: {
        animalId: data.animalId,
        applicantId,
        status: { in: [RequestStatus.PENDIENTE, RequestStatus.EN_REVISION] },
        deletedAt: null,
      },
    });

    if (existingApplication) {
      throw new HttpError(409, "Ya cuentas con una postulación activa en curso para este animal.");
    }

    const applicant = await prisma.user.findUnique({
      where: { id: applicantId },
      select: { name: true, email: true },
    });

    const request = await prisma.adoptionRequest.create({
      data: {
        animalId: data.animalId,
        applicantId,
        type: data.type,
        message: data.message,
        phone: data.phone,
        address: data.address,
        hasOtherPets: data.hasOtherPets,
        hasYard: data.hasYard,
        housingType: data.housingType,
        landlordAllowsPets: data.landlordAllowsPets,
        status: RequestStatus.PENDIENTE,
      },
    });

    // Despacho asíncrono de correos transaccionales duales
    if (applicant) {
      emailService
        .sendNewApplicationNotice(
          animal.publisher.email,
          animal.publisher.name,
          animal.name,
          applicant.name
        )
        .catch((err) => console.error("Error al notificar al publicador:", err));

      emailService
        .sendApplicationConfirmationNotice(applicant.email, applicant.name, animal.name)
        .catch((err) => console.error("Error al enviar constancia al adoptante:", err));
    }

    return {
      message: "Postulación enviada exitosamente.",
      requestId: request.id,
      status: request.status,
    };
  }

  /**
   * Bandeja de postulaciones recibidas para un animal publicado
   */
  async getApplicationsByAnimal(animalId: string, userId: string, userRole: Role) {
    const animal = await prisma.animal.findFirst({
      where: { id: animalId, deletedAt: null },
    });

    if (!animal) {
      throw new HttpError(404, "Publicación no encontrada.");
    }

    if (animal.publisherId !== userId && userRole !== Role.ADMIN) {
      throw new HttpError(403, "No tiene permisos para ver las postulaciones de esta publicación.");
    }

    const applications = await prisma.adoptionRequest.findMany({
      where: { animalId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            province: true,
            city: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    return applications;
  }

  /**
   * Historial de postulaciones emitidas por el usuario en sesión
   */
  async getMyApplications(applicantId: string) {
    const applications = await prisma.adoptionRequest.findMany({
      where: { applicantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            status: true,
            province: true,
            city: true,
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
            publisher: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return applications.map((app) => ({
      ...app,
      animal: {
        ...app.animal,
        mainImage: app.animal.images[0]?.url || null,
      },
    }));
  }

  /**
   * Dictamen de una postulación (Aprobación con creación de Follow-Up de 6 meses o Rechazo)
   */
  async updateApplicationStatus(
    requestId: string,
    userId: string,
    userRole: Role,
    data: UpdateApplicationStatusInput
  ) {
    const request = await prisma.adoptionRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      include: {
        animal: true,
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new HttpError(404, "Postulación no encontrada.");
    }

    if (request.animal.publisherId !== userId && userRole !== Role.ADMIN) {
      throw new HttpError(403, "No tiene permisos para gestionar esta postulación.");
    }

    if (request.status !== RequestStatus.PENDIENTE && request.status !== RequestStatus.EN_REVISION) {
      throw new HttpError(409, `La postulación ya fue resuelta (${request.status}).`);
    }

    if (
      data.status === RequestStatus.APROBADA &&
      request.animal.status !== AnimalStatus.DISPONIBLE &&
      request.animal.status !== AnimalStatus.EN_PROCESO
    ) {
      throw new HttpError(409, "El animal ya no está disponible para ser adjudicado.");
    }

    let followUpCreated = false;
    let followUpId: string | undefined;

    // Transacción atómica
    await prisma.$transaction(async (tx) => {
      // Actualizar estado de la postulación
      await tx.adoptionRequest.update({
        where: { id: requestId },
        data: {
          status: data.status,
          rejectionReason: data.status === RequestStatus.RECHAZADA ? data.rejectionReason : null,
        },
      });

      // Si fue aprobada la adopción definitiva o tránsito
      if (data.status === RequestStatus.APROBADA) {
        const newAnimalStatus =
          request.type === Modality.ADOPCION_DEFINITIVA
            ? AnimalStatus.ADOPTADO
            : AnimalStatus.EN_TRANSITO;

        // Actualizar estado del animal
        await tx.animal.update({
          where: { id: request.animalId },
          data: { status: newAnimalStatus },
        });

        // Cancelar otras postulaciones pendientes para el mismo animal
        await tx.adoptionRequest.updateMany({
          where: {
            animalId: request.animalId,
            id: { not: requestId },
            status: { in: [RequestStatus.PENDIENTE, RequestStatus.EN_REVISION] },
          },
          data: {
            status: RequestStatus.CANCELADA,
            rejectionReason: "El animal ya fue adjudicado a otro postulante.",
          },
        });

        // Generar expediente de Seguimiento Post-Adopción estricto de 6 meses (ADR-003)
        const existingFollowUp = await tx.followUp.findUnique({
          where: { animalId: request.animalId },
        });

        if (!existingFollowUp) {
          const now = new Date();
          const endDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 días exactos (6 meses)

          const newFollowUp = await tx.followUp.create({
            data: {
              animalId: request.animalId,
              adopterId: request.applicantId,
              guardianId: request.animal.publisherId,
              startDate: now,
              endDate,
              durationMonths: 6,
              status: FollowUpStatus.ACTIVO,
            },
          });

          // Insertar exactamente 6 reportes mensuales con sus fechas límite
          const reportsData = [];
          for (let month = 1; month <= 6; month++) {
            const dueDate = new Date(now.getTime() + month * 30 * 24 * 60 * 60 * 1000);
            reportsData.push({
              followUpId: newFollowUp.id,
              monthNumber: month,
              dueDate,
              status: ReportStatus.PENDIENTE,
            });
          }

          await tx.followUpReport.createMany({
            data: reportsData,
          });

          followUpCreated = true;
          followUpId = newFollowUp.id;
        }
      }
    });

    // Notificar al adoptante sobre la resolución
    emailService
      .sendApplicationStatusChangeNotice(
        request.applicant.email,
        request.applicant.name,
        request.animal.name,
        data.status,
        data.rejectionReason
      )
      .catch((err) => console.error("Error al notificar resolución de postulación:", err));

    return {
      message: `Estado de la postulación actualizado a ${data.status}.`,
      followUpCreated,
      followUpId,
    };
  }
}

export const contactsService = new ContactsService();
export default contactsService;

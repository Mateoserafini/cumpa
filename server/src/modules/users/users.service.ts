import prisma from "../../config/prisma";
import { HttpError } from "../../middlewares/errorHandler.middleware";
import { uploadToCloudinary } from "../../config/cloudinary.config";
import { validateCuit } from "../../utils/cuitValidator";
import { VerificationStatus, Role } from "@prisma/client";

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  address?: string;
  avatarUrl?: string;
}

export interface InstitutionalVerificationInput {
  legalName: string;
  cuit: string;
  websiteUrl?: string;
  instagramUrl?: string;
}

export class UsersService {
  /**
   * Obtiene los datos del perfil del usuario autenticado
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        province: true,
        city: true,
        address: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
        institutionalProfile: {
          select: {
            id: true,
            legalName: true,
            cuit: true,
            verificationStatus: true,
            verificationNotes: true,
            verifiedAt: true,
            documentUrl: true,
            websiteUrl: true,
            instagramUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpError(404, "Usuario no encontrado.");
    }

    return user;
  }

  /**
   * Actualiza la información personal de contacto del perfil
   */
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new HttpError(404, "Usuario no encontrado.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ?? user.name,
        phone: data.phone ?? user.phone,
        province: data.province ?? user.province,
        city: data.city ?? user.city,
        address: data.address ?? user.address,
        avatarUrl: data.avatarUrl ?? user.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        province: true,
        city: true,
        address: true,
        avatarUrl: true,
        isEmailVerified: true,
      },
    });

    return {
      message: "Perfil actualizado correctamente.",
      user: updatedUser,
    };
  }

  /**
   * Presentación de solicitud de verificación de personería institucional con CUIT
   */
  async submitInstitutionalVerification(
    userId: string,
    userRole: Role,
    data: InstitutionalVerificationInput,
    documentFile?: Express.Multer.File
  ) {
    if (userRole !== Role.INSTITUCION && userRole !== Role.VETERINARIA) {
      throw new HttpError(
        403,
        "Solo los usuarios con rol INSTITUCION o VETERINARIA pueden solicitar verificación institucional."
      );
    }

    const validation = validateCuit(data.cuit);
    if (!validation.isValid) {
      throw new HttpError(400, validation.errorMessage || "CUIT inválido.");
    }

    const cleanCuit = validation.cleanCuit;

    // Verificar si el CUIT ya pertenece a otra cuenta institucional
    const existingCuit = await prisma.institutionalProfile.findFirst({
      where: {
        cuit: cleanCuit,
        userId: { not: userId },
        deletedAt: null,
      },
    });

    if (existingCuit) {
      throw new HttpError(409, "El CUIT ingresado ya se encuentra registrado por otra institución.");
    }

    // Subir comprobante a Cloudinary si se adjuntó archivo
    let documentUrl: string | undefined;
    if (documentFile) {
      const uploadRes = await uploadToCloudinary(
        documentFile.buffer,
        "cumpa/documentos_cuit",
        documentFile.originalname
      );
      documentUrl = uploadRes.url;
    }

    // Verificación de estado previo de habilitación
    const existingProfile = await prisma.institutionalProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      if (existingProfile.verificationStatus === VerificationStatus.APROBADA) {
        throw new HttpError(
          409,
          "La institución ya se encuentra verificada y habilitada. No es posible solicitar una nueva habilitación sin haberla perdido previamente."
        );
      }

      if (existingProfile.verificationStatus === VerificationStatus.PENDIENTE) {
        throw new HttpError(
          409,
          "Ya cuenta con una solicitud de habilitación institucional en revisión por la administración."
        );
      }
    }

    let profile;
    if (existingProfile) {
      profile = await prisma.institutionalProfile.update({
        where: { userId },
        data: {
          legalName: data.legalName,
          cuit: cleanCuit,
          websiteUrl: data.websiteUrl ?? existingProfile.websiteUrl,
          instagramUrl: data.instagramUrl ?? existingProfile.instagramUrl,
          documentUrl: documentUrl ?? existingProfile.documentUrl,
          verificationStatus: VerificationStatus.PENDIENTE,
          verificationNotes: null,
        },
      });
    } else {
      profile = await prisma.institutionalProfile.create({
        data: {
          userId,
          legalName: data.legalName,
          cuit: cleanCuit,
          websiteUrl: data.websiteUrl,
          instagramUrl: data.instagramUrl,
          documentUrl: documentUrl || null,
          verificationStatus: VerificationStatus.PENDIENTE,
        },
      });
    }

    return {
      message: "Solicitud de verificación institucional enviada para revisión por el equipo de administración.",
      profileId: profile.id,
      status: profile.verificationStatus,
    };
  }

  /**
   * Consulta del estado de verificación de personería legal
   */
  async getInstitutionalStatus(userId: string) {
    const profile = await prisma.institutionalProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        legalName: true,
        cuit: true,
        verificationStatus: true,
        verificationNotes: true,
        verifiedAt: true,
        documentUrl: true,
      },
    });

    if (!profile) {
      throw new HttpError(404, "No se ha registrado ninguna postulación de personería institucional para esta cuenta.");
    }

    return profile;
  }
}

export const usersService = new UsersService();
export default usersService;

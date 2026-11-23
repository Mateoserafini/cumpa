import prisma from "../../config/prisma";
import { HttpError } from "../../middlewares/errorHandler.middleware";
import { uploadToCloudinary } from "../../config/cloudinary.config";
import {
  Species,
  Sex,
  Size,
  AgeCategory,
  Modality,
  AnimalStatus,
  Role,
  Prisma,
} from "@prisma/client";

export interface FilterAnimalsQuery {
  page?: number;
  limit?: number;
  species?: Species;
  sex?: Sex;
  size?: Size;
  ageCategory?: AgeCategory;
  modality?: Modality;
  province?: string;
  city?: string;
  search?: string;
}

export interface CreateAnimalDto {
  name: string;
  species: Species;
  breed?: string;
  sex: Sex;
  size: Size;
  ageCategory: AgeCategory;
  approximateAgeMonths?: number;
  description: string;
  healthDetails?: string;
  isNeutered?: boolean;
  isVaccinated?: boolean;
  isDewormed?: boolean;
  specialNeeds?: boolean;
  specialNeedsDescription?: string;
  modality: Modality;
  province: string;
  city: string;
}

export class AnimalsService {
  /**
   * Catálogo paginado con filtros facetados
   */
  async getAnimals(query: FilterAnimalsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
      status: { in: [AnimalStatus.DISPONIBLE, AnimalStatus.EN_PROCESO] },
    };

    if (query.species) where.species = query.species;
    if (query.sex) where.sex = query.sex;
    if (query.size) where.size = query.size;
    if (query.ageCategory) where.ageCategory = query.ageCategory;
    if (query.modality) where.modality = query.modality;
    if (query.province) {
      where.province = { contains: query.province, mode: "insensitive" };
    }
    if (query.city) {
      where.city = { contains: query.city, mode: "insensitive" };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { breed: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, animals] = await prisma.$transaction([
      prisma.animal.count({ where }),
      prisma.animal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            orderBy: { order: "asc" },
            take: 1, // Foto principal para tarjeta
          },
          publisher: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
              institutionalProfile: {
                select: {
                  legalName: true,
                  verificationStatus: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const formattedData = animals.map((animal) => ({
      id: animal.id,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      sex: animal.sex,
      size: animal.size,
      ageCategory: animal.ageCategory,
      modality: animal.modality,
      status: animal.status,
      province: animal.province,
      city: animal.city,
      mainImage: animal.images[0]?.url ?? null,
      createdAt: animal.createdAt,
      publisher: {
        id: animal.publisher.id,
        name: animal.publisher.name,
        role: animal.publisher.role,
        isVerifiedInstitution: animal.publisher.institutionalProfile?.verificationStatus === "APROBADA",
      },
    }));

    return {
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      data: formattedData,
    };
  }

  /**
   * Ficha técnica y galería completa de un animal
   */
  async getAnimalById(id: string) {
    const animal = await prisma.animal.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        publisher: {
          select: {
            id: true,
            name: true,
            role: true,
            province: true,
            city: true,
            avatarUrl: true,
            createdAt: true,
            institutionalProfile: {
              select: {
                legalName: true,
                cuit: true,
                verificationStatus: true,
                websiteUrl: true,
                instagramUrl: true,
              },
            },
          },
        },
      },
    });

    if (!animal) {
      throw new HttpError(404, "Publicación del animal no encontrada o inactiva.");
    }

    return animal;
  }

  /**
   * Listado de animales publicados por el usuario actual
   */
  async getMyPublications(userId: string) {
    const animals = await prisma.animal.findMany({
      where: {
        publisherId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            adoptionRequests: {
              where: { status: "PENDIENTE", deletedAt: null },
            },
          },
        },
      },
    });

    return animals.map((animal) => ({
      ...animal,
      pendingRequestsCount: animal._count.adoptionRequests,
    }));
  }

  /**
   * Alta de nueva publicación con subida de fotografías
   */
  async createAnimal(
    publisherId: string,
    data: CreateAnimalDto,
    files?: Express.Multer.File[]
  ) {
    if (!files || files.length === 0) {
      throw new HttpError(400, "Debe adjuntar al menos una fotografía del animal.");
    }
    const imagesToUpload: Array<{ url: string; publicId: string; isMain: boolean; order: number }> = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadResult = await uploadToCloudinary(file.buffer, "cumpa/animales", file.originalname);
        imagesToUpload.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          isMain: i === 0,
          order: i,
        });
      }
    }

    const animal = await prisma.$transaction(async (tx) => {
      const newAnimal = await tx.animal.create({
        data: {
          publisherId,
          name: data.name,
          species: data.species,
          breed: data.breed,
          sex: data.sex,
          size: data.size,
          ageCategory: data.ageCategory,
          approximateAgeMonths: data.approximateAgeMonths ? Number(data.approximateAgeMonths) : null,
          description: data.description,
          healthDetails: data.healthDetails,
          isNeutered: Boolean(data.isNeutered),
          isVaccinated: Boolean(data.isVaccinated),
          isDewormed: Boolean(data.isDewormed),
          specialNeeds: Boolean(data.specialNeeds),
          specialNeedsDescription: data.specialNeedsDescription,
          modality: data.modality,
          province: data.province,
          city: data.city,
          status: AnimalStatus.DISPONIBLE,
        },
      });

      await tx.animalImage.createMany({
        data: imagesToUpload.map((img) => ({
          animalId: newAnimal.id,
          url: img.url,
          publicId: img.publicId,
          isMain: img.isMain,
          order: img.order,
        })),
      });

      return newAnimal;
    });

    return {
      message: "Publicación creada exitosamente.",
      id: animal.id,
      name: animal.name,
      status: animal.status,
      imagesCount: imagesToUpload.length,
      createdAt: animal.createdAt,
    };
  }

  /**
   * Modificación de atributos de una publicación
   */
  async updateAnimal(
    animalId: string,
    userId: string,
    userRole: Role,
    data: Partial<CreateAnimalDto>
  ) {
    const animal = await prisma.animal.findFirst({
      where: { id: animalId, deletedAt: null },
    });

    if (!animal) {
      throw new HttpError(404, "Publicación no encontrada.");
    }

    if (animal.publisherId !== userId && userRole !== Role.ADMIN) {
      throw new HttpError(403, "No tiene permisos para modificar esta publicación.");
    }

    const updated = await prisma.animal.update({
      where: { id: animalId },
      data: {
        name: data.name ?? animal.name,
        species: data.species ?? animal.species,
        breed: data.breed !== undefined ? data.breed : animal.breed,
        sex: data.sex ?? animal.sex,
        size: data.size ?? animal.size,
        ageCategory: data.ageCategory ?? animal.ageCategory,
        approximateAgeMonths:
          data.approximateAgeMonths !== undefined
            ? Number(data.approximateAgeMonths)
            : animal.approximateAgeMonths,
        description: data.description ?? animal.description,
        healthDetails: data.healthDetails !== undefined ? data.healthDetails : animal.healthDetails,
        isNeutered: data.isNeutered !== undefined ? Boolean(data.isNeutered) : animal.isNeutered,
        isVaccinated: data.isVaccinated !== undefined ? Boolean(data.isVaccinated) : animal.isVaccinated,
        isDewormed: data.isDewormed !== undefined ? Boolean(data.isDewormed) : animal.isDewormed,
        specialNeeds: data.specialNeeds !== undefined ? Boolean(data.specialNeeds) : animal.specialNeeds,
        specialNeedsDescription:
          data.specialNeedsDescription !== undefined
            ? data.specialNeedsDescription
            : animal.specialNeedsDescription,
        modality: data.modality ?? animal.modality,
        province: data.province ?? animal.province,
        city: data.city ?? animal.city,
      },
    });

    return {
      message: "Publicación actualizada correctamente.",
      animal: updated,
    };
  }

  /**
   * Cambio de estado operativo del animal
   */
  async updateStatus(
    animalId: string,
    userId: string,
    userRole: Role,
    status: AnimalStatus
  ) {
    const animal = await prisma.animal.findFirst({
      where: { id: animalId, deletedAt: null },
    });

    if (!animal) {
      throw new HttpError(404, "Publicación no encontrada.");
    }

    if (animal.publisherId !== userId && userRole !== Role.ADMIN) {
      throw new HttpError(403, "No tiene permisos para modificar el estado de esta publicación.");
    }

    if (animal.status === AnimalStatus.ADOPTADO || animal.status === AnimalStatus.EN_TRANSITO) {
      throw new HttpError(409, "El estado de un animal adoptado o en tránsito lo gestiona el proceso de postulación.");
    }

    const updated = await prisma.animal.update({
      where: { id: animalId },
      data: { status },
    });

    return {
      message: `Estado de la publicación actualizado a ${status}.`,
      animal: updated,
    };
  }

  /**
   * Baja lógica (soft-delete) de la publicación
   */
  async deleteAnimal(animalId: string, userId: string, userRole: Role) {
    const animal = await prisma.animal.findFirst({
      where: { id: animalId, deletedAt: null },
    });

    if (!animal) {
      throw new HttpError(404, "Publicación no encontrada.");
    }

    if (animal.publisherId !== userId && userRole !== Role.ADMIN) {
      throw new HttpError(403, "No tiene permisos para eliminar esta publicación.");
    }

    await prisma.animal.update({
      where: { id: animalId },
      data: { deletedAt: new Date() },
    });

    return {
      message: "Publicación eliminada correctamente (baja lógica).",
    };
  }
}

export const animalsService = new AnimalsService();
export default animalsService;

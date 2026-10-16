import crypto from "crypto";
import {
  Role,
  VerificationStatus,
  Species,
  Sex,
  Size,
  AgeCategory,
  Modality,
  AnimalStatus,
  RequestStatus,
  FollowUpStatus,
  ReportStatus,
} from "@prisma/client";

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  role: Role;
  name: string;
  phone: string | null;
  province: string;
  city: string;
  address: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  verificationToken: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockInstitutionalProfile {
  id: string;
  userId: string;
  legalName: string;
  cuit: string;
  verificationStatus: VerificationStatus;
  verificationNotes: string | null;
  verifiedAt: Date | null;
  verifiedByAdminId: string | null;
  documentUrl: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockAnimal {
  id: string;
  publisherId: string;
  name: string;
  species: Species;
  breed: string | null;
  sex: Sex;
  size: Size;
  ageCategory: AgeCategory;
  approximateAgeMonths: number | null;
  description: string;
  healthDetails: string | null;
  isNeutered: boolean;
  isVaccinated: boolean;
  isDewormed: boolean;
  specialNeeds: boolean;
  specialNeedsDescription: string | null;
  modality: Modality;
  status: AnimalStatus;
  province: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockAnimalImage {
  id: string;
  animalId: string;
  url: string;
  publicId: string;
  isMain: boolean;
  order: number;
  createdAt: Date;
}

export interface MockAdoptionRequest {
  id: string;
  animalId: string;
  applicantId: string;
  type: Modality;
  status: RequestStatus;
  message: string;
  phone: string;
  address: string | null;
  hasOtherPets: boolean;
  hasYard: boolean;
  housingType: string | null;
  landlordAllowsPets: boolean | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockFollowUp {
  id: string;
  animalId: string;
  adopterId: string;
  guardianId: string;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  status: FollowUpStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockFollowUpReport {
  id: string;
  followUpId: string;
  monthNumber: number;
  dueDate: Date;
  submittedAt: Date | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  notes: string | null;
  status: ReportStatus;
  reminderSentAt: Date | null;
  alertSentAt: Date | null;
  reviewedByGuardian: boolean;
  guardianFeedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory collections
export const db = {
  users: [] as MockUser[],
  institutionalProfiles: [] as MockInstitutionalProfile[],
  animals: [] as MockAnimal[],
  animalImages: [] as MockAnimalImage[],
  adoptionRequests: [] as MockAdoptionRequest[],
  followUps: [] as MockFollowUp[],
  followUpReports: [] as MockFollowUpReport[],
};

export function resetMockDb() {
  db.users = [];
  db.institutionalProfiles = [];
  db.animals = [];
  db.animalImages = [];
  db.adoptionRequests = [];
  db.followUps = [];
  db.followUpReports = [];
}

function matchesFilter(val: any, filter: any): boolean {
  if (filter === undefined) return true;
  if (filter === null) return val === null;
  if (typeof filter === "object") {
    if ("in" in filter) {
      return Array.isArray(filter.in) && filter.in.includes(val);
    }
    if ("not" in filter) {
      return val !== filter.not;
    }
    if ("gt" in filter) {
      return val instanceof Date && filter.gt instanceof Date ? val > filter.gt : val > filter.gt;
    }
    if ("contains" in filter) {
      const mode = filter.mode || "default";
      const source = String(val || "");
      const target = String(filter.contains || "");
      return mode === "insensitive"
        ? source.toLowerCase().includes(target.toLowerCase())
        : source.includes(target);
    }
  }
  return val === filter;
}

function filterAnimalsWhere(animal: MockAnimal, where: any): boolean {
  if (!where) return true;
  if (where.deletedAt === null && animal.deletedAt !== null) return false;
  if (where.status && !matchesFilter(animal.status, where.status)) return false;
  if (where.species && !matchesFilter(animal.species, where.species)) return false;
  if (where.sex && !matchesFilter(animal.sex, where.sex)) return false;
  if (where.size && !matchesFilter(animal.size, where.size)) return false;
  if (where.ageCategory && !matchesFilter(animal.ageCategory, where.ageCategory)) return false;
  if (where.modality && !matchesFilter(animal.modality, where.modality)) return false;
  if (where.province && !matchesFilter(animal.province, where.province)) return false;
  if (where.city && !matchesFilter(animal.city, where.city)) return false;
  if (where.publisherId && !matchesFilter(animal.publisherId, where.publisherId)) return false;
  if (where.id && !matchesFilter(animal.id, where.id)) return false;

  if (where.OR && Array.isArray(where.OR)) {
    const orMatches = where.OR.some((orClause: any) => {
      for (const [key, filter] of Object.entries(orClause)) {
        if (matchesFilter((animal as any)[key], filter)) return true;
      }
      return false;
    });
    if (!orMatches) return false;
  }

  return true;
}

function attachAnimalRelations(animal: MockAnimal, include: any) {
  const result: any = { ...animal };
  if (include?.images) {
    let images = db.animalImages.filter((img) => img.animalId === animal.id);
    if (include.images.orderBy?.order === "asc") {
      images = images.sort((a, b) => a.order - b.order);
    }
    if (include.images.take) {
      images = images.slice(0, include.images.take);
    }
    result.images = images;
  }
  if (include?.publisher) {
    const pub = db.users.find((u) => u.id === animal.publisherId);
    if (pub) {
      const pubResult: any = {
        id: pub.id,
        name: pub.name,
        email: pub.email,
        role: pub.role,
        province: pub.province,
        city: pub.city,
        avatarUrl: pub.avatarUrl,
        createdAt: pub.createdAt,
      };
      if (include.publisher.select?.institutionalProfile) {
        const inst = db.institutionalProfiles.find((ip) => ip.userId === pub.id);
        pubResult.institutionalProfile = inst
          ? {
              legalName: inst.legalName,
              cuit: inst.cuit,
              verificationStatus: inst.verificationStatus,
              websiteUrl: inst.websiteUrl,
              instagramUrl: inst.instagramUrl,
            }
          : null;
      }
      result.publisher = pubResult;
    }
  }
  return result;
}

function attachFollowUpRelations(followUp: MockFollowUp, include: any) {
  const res: any = { ...followUp };
  if (include?.reports) {
    res.reports = db.followUpReports
      .filter((r) => r.followUpId === followUp.id)
      .sort((a, b) => a.monthNumber - b.monthNumber);
  }
  if (include?.animal) {
    const animal = db.animals.find((a) => a.id === followUp.animalId);
    if (animal) {
      const animalImages = db.animalImages.filter((img) => img.animalId === animal.id);
      res.animal = {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        images: animalImages.map((img) => ({ url: img.url })),
      };
    } else {
      res.animal = null;
    }
  }
  if (include?.guardian) {
    const guardian = db.users.find((u) => u.id === followUp.guardianId);
    if (guardian) {
      res.guardian = {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone,
      };
    } else {
      res.guardian = null;
    }
  }
  if (include?.adopter) {
    const adopter = db.users.find((u) => u.id === followUp.adopterId);
    if (adopter) {
      res.adopter = {
        id: adopter.id,
        name: adopter.name,
        email: adopter.email,
        phone: adopter.phone,
      };
    } else {
      res.adopter = null;
    }
  }
  return res;
}

export const mockPrisma: any = {
  user: {
    async findFirst({ where, select }: any = {}) {
      const found = db.users.find((u) => {
        if (where?.id && !matchesFilter(u.id, where.id)) return false;
        if (where?.email && !matchesFilter(u.email, where.email)) return false;
        if (where?.verificationToken && !matchesFilter(u.verificationToken, where.verificationToken)) return false;
        if (where?.resetPasswordToken && !matchesFilter(u.resetPasswordToken, where.resetPasswordToken)) return false;
        if (where?.resetPasswordExpires && !matchesFilter(u.resetPasswordExpires, where.resetPasswordExpires)) return false;
        if (where?.deletedAt === null && u.deletedAt !== null) return false;
        return true;
      });
      if (!found) return null;
      if (select) {
        const selected: any = {};
        for (const k of Object.keys(select)) {
          if (select[k]) selected[k] = (found as any)[k];
        }
        return selected;
      }
      return { ...found };
    },

    async findUnique({ where, select, include }: any = {}) {
      const found = db.users.find((u) => {
        if (where?.id && u.id === where.id) return true;
        if (where?.email && u.email === where.email) return true;
        if (where?.googleId && u.googleId === where.googleId) return true;
        return false;
      });
      if (!found) return null;
      const res: any = { ...found };
      if (include?.institutionalProfile) {
        res.institutionalProfile = db.institutionalProfiles.find((ip) => ip.userId === found.id) || null;
      }
      if (select) {
        const selected: any = {};
        for (const k of Object.keys(select)) {
          if (select[k]) selected[k] = res[k];
        }
        return selected;
      }
      return res;
    },

    async create({ data }: any) {
      const newUser: MockUser = {
        id: crypto.randomUUID(),
        email: data.email,
        passwordHash: data.passwordHash || null,
        googleId: data.googleId || null,
        role: data.role || Role.PARTICULAR,
        name: data.name,
        phone: data.phone || null,
        province: data.province,
        city: data.city,
        address: data.address || null,
        avatarUrl: data.avatarUrl || null,
        isEmailVerified: Boolean(data.isEmailVerified),
        verificationToken: data.verificationToken || null,
        resetPasswordToken: data.resetPasswordToken || null,
        resetPasswordExpires: data.resetPasswordExpires || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      db.users.push(newUser);
      return { ...newUser };
    },

    async update({ where, data }: any) {
      const idx = db.users.findIndex((u) => u.id === where.id || u.email === where.email);
      if (idx === -1) throw new Error("User not found for update");
      const user = db.users[idx];
      const updated: MockUser = {
        ...user,
        ...data,
        updatedAt: new Date(),
      };
      db.users[idx] = updated;
      return { ...updated };
    },
  },

  institutionalProfile: {
    async findUnique({ where }: any) {
      const found = db.institutionalProfiles.find((ip) => {
        if (where?.userId && ip.userId === where.userId) return true;
        if (where?.id && ip.id === where.id) return true;
        if (where?.cuit && ip.cuit === where.cuit) return true;
        return false;
      });
      return found ? { ...found } : null;
    },

    async create({ data }: any) {
      const newProfile: MockInstitutionalProfile = {
        id: crypto.randomUUID(),
        userId: data.userId,
        legalName: data.legalName,
        cuit: data.cuit,
        verificationStatus: data.verificationStatus || VerificationStatus.PENDIENTE,
        verificationNotes: data.verificationNotes || null,
        verifiedAt: data.verifiedAt || null,
        verifiedByAdminId: data.verifiedByAdminId || null,
        documentUrl: data.documentUrl || null,
        websiteUrl: data.websiteUrl || null,
        instagramUrl: data.instagramUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      db.institutionalProfiles.push(newProfile);
      return { ...newProfile };
    },

    async update({ where, data }: any) {
      const idx = db.institutionalProfiles.findIndex(
        (ip) => ip.userId === where.userId || ip.id === where.id
      );
      if (idx === -1) throw new Error("InstitutionalProfile not found for update");
      const updated = { ...db.institutionalProfiles[idx], ...data, updatedAt: new Date() };
      db.institutionalProfiles[idx] = updated;
      return { ...updated };
    },
  },

  animal: {
    async count({ where }: any = {}) {
      return db.animals.filter((a) => filterAnimalsWhere(a, where)).length;
    },

    async findMany({ where, skip = 0, take = 50, orderBy, include }: any = {}) {
      let filtered = db.animals.filter((a) => filterAnimalsWhere(a, where));
      if (orderBy?.createdAt === "desc") {
        filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      const pageSlice = filtered.slice(skip, skip + take);
      return pageSlice.map((a) => attachAnimalRelations(a, include));
    },

    async findFirst({ where, include }: any = {}) {
      const found = db.animals.find((a) => filterAnimalsWhere(a, where));
      if (!found) return null;
      return attachAnimalRelations(found, include);
    },

    async create({ data }: any) {
      const newAnimal: MockAnimal = {
        id: crypto.randomUUID(),
        publisherId: data.publisherId,
        name: data.name,
        species: data.species,
        breed: data.breed || null,
        sex: data.sex,
        size: data.size,
        ageCategory: data.ageCategory,
        approximateAgeMonths: data.approximateAgeMonths || null,
        description: data.description,
        healthDetails: data.healthDetails || null,
        isNeutered: Boolean(data.isNeutered),
        isVaccinated: Boolean(data.isVaccinated),
        isDewormed: Boolean(data.isDewormed),
        specialNeeds: Boolean(data.specialNeeds),
        specialNeedsDescription: data.specialNeedsDescription || null,
        modality: data.modality || Modality.ADOPCION_DEFINITIVA,
        status: data.status || AnimalStatus.DISPONIBLE,
        province: data.province,
        city: data.city,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      db.animals.push(newAnimal);
      return { ...newAnimal };
    },

    async update({ where, data }: any) {
      const idx = db.animals.findIndex((a) => a.id === where.id);
      if (idx === -1) throw new Error("Animal not found for update");
      const updated: MockAnimal = {
        ...db.animals[idx],
        ...data,
        updatedAt: new Date(),
      };
      db.animals[idx] = updated;
      return { ...updated };
    },
  },

  animalImage: {
    async createMany({ data }: any) {
      const items = Array.isArray(data) ? data : [data];
      const created = items.map((item: any) => {
        const img: MockAnimalImage = {
          id: crypto.randomUUID(),
          animalId: item.animalId,
          url: item.url,
          publicId: item.publicId,
          isMain: Boolean(item.isMain),
          order: Number(item.order) || 0,
          createdAt: new Date(),
        };
        db.animalImages.push(img);
        return img;
      });
      return { count: created.length };
    },
  },

  adoptionRequest: {
    async findFirst({ where, include }: any = {}) {
      const found = db.adoptionRequests.find((req) => {
        if (where?.id && !matchesFilter(req.id, where.id)) return false;
        if (where?.animalId && !matchesFilter(req.animalId, where.animalId)) return false;
        if (where?.applicantId && !matchesFilter(req.applicantId, where.applicantId)) return false;
        if (where?.status && !matchesFilter(req.status, where.status)) return false;
        if (where?.deletedAt === null && req.deletedAt !== null) return false;
        return true;
      });
      if (!found) return null;
      const res: any = { ...found };
      if (include?.animal) {
        const animal = db.animals.find((a) => a.id === found.animalId);
        res.animal = animal ? { ...animal } : null;
      }
      if (include?.applicant) {
        const app = db.users.find((u) => u.id === found.applicantId);
        res.applicant = app
          ? {
              id: app.id,
              name: app.name,
              email: app.email,
              province: app.province,
              city: app.city,
              avatarUrl: app.avatarUrl,
              createdAt: app.createdAt,
            }
          : null;
      }
      return res;
    },

    async findMany({ where, orderBy, include }: any = {}) {
      let filtered = db.adoptionRequests.filter((req) => {
        if (where?.animalId && req.animalId !== where.animalId) return false;
        if (where?.applicantId && req.applicantId !== where.applicantId) return false;
        if (where?.deletedAt === null && req.deletedAt !== null) return false;
        return true;
      });
      if (orderBy?.createdAt === "desc") {
        filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return filtered.map((req) => {
        const res: any = { ...req };
        if (include?.applicant) {
          const app = db.users.find((u) => u.id === req.applicantId);
          res.applicant = app
            ? {
                id: app.id,
                name: app.name,
                email: app.email,
                province: app.province,
                city: app.city,
                avatarUrl: app.avatarUrl,
                createdAt: app.createdAt,
              }
            : null;
        }
        return res;
      });
    },

    async create({ data }: any) {
      const newReq: MockAdoptionRequest = {
        id: crypto.randomUUID(),
        animalId: data.animalId,
        applicantId: data.applicantId,
        type: data.type || Modality.ADOPCION_DEFINITIVA,
        status: data.status || RequestStatus.PENDIENTE,
        message: data.message,
        phone: data.phone,
        address: data.address || null,
        hasOtherPets: Boolean(data.hasOtherPets),
        hasYard: Boolean(data.hasYard),
        housingType: data.housingType || null,
        landlordAllowsPets: data.landlordAllowsPets ?? null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      db.adoptionRequests.push(newReq);
      return { ...newReq };
    },

    async update({ where, data }: any) {
      const idx = db.adoptionRequests.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error("AdoptionRequest not found for update");
      const updated: MockAdoptionRequest = {
        ...db.adoptionRequests[idx],
        ...data,
        updatedAt: new Date(),
      };
      db.adoptionRequests[idx] = updated;
      return { ...updated };
    },

    async updateMany({ where, data }: any) {
      let count = 0;
      for (let i = 0; i < db.adoptionRequests.length; i++) {
        const r = db.adoptionRequests[i];
        if (where?.animalId && r.animalId !== where.animalId) continue;
        if (where?.id?.not && r.id === where.id.not) continue;
        if (where?.status?.in && !where.status.in.includes(r.status)) continue;
        db.adoptionRequests[i] = { ...r, ...data, updatedAt: new Date() };
        count++;
      }
      return { count };
    },
  },

  followUp: {
    async findUnique({ where, include }: any) {
      const found = db.followUps.find((f) => {
        if (where?.animalId && f.animalId === where.animalId) return true;
        if (where?.id && f.id === where.id) return true;
        return false;
      });
      if (!found) return null;
      return attachFollowUpRelations(found, include);
    },

    async findMany({ where, include, orderBy }: any = {}) {
      let list = db.followUps.filter((f) => {
        if (where?.adopterId && f.adopterId !== where.adopterId) return false;
        if (where?.guardianId && f.guardianId !== where.guardianId) return false;
        if (where?.deletedAt === null && f.deletedAt !== null) return false;
        return true;
      });
      if (orderBy?.createdAt === "desc") {
        list = list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return list.map((f) => attachFollowUpRelations(f, include));
    },

    async create({ data }: any) {
      const newFollowUp: MockFollowUp = {
        id: crypto.randomUUID(),
        animalId: data.animalId,
        adopterId: data.adopterId,
        guardianId: data.guardianId,
        startDate: data.startDate || new Date(),
        endDate: data.endDate,
        durationMonths: data.durationMonths || 6,
        status: data.status || FollowUpStatus.ACTIVO,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      db.followUps.push(newFollowUp);
      return { ...newFollowUp };
    },
  },

  followUpReport: {
    async createMany({ data }: any) {
      const items = Array.isArray(data) ? data : [data];
      const created = items.map((item: any) => {
        const report: MockFollowUpReport = {
          id: crypto.randomUUID(),
          followUpId: item.followUpId,
          monthNumber: item.monthNumber,
          dueDate: item.dueDate,
          submittedAt: null,
          imageUrl: null,
          imagePublicId: null,
          notes: null,
          status: item.status || ReportStatus.PENDIENTE,
          reminderSentAt: null,
          alertSentAt: null,
          reviewedByGuardian: false,
          guardianFeedback: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        db.followUpReports.push(report);
        return report;
      });
      return { count: created.length };
    },

    async findMany({ where, orderBy }: any = {}) {
      let filtered = db.followUpReports.filter((r) => {
        if (where?.followUpId && r.followUpId !== where.followUpId) return false;
        return true;
      });
      if (orderBy?.monthNumber === "asc") {
        filtered = filtered.sort((a, b) => a.monthNumber - b.monthNumber);
      }
      return filtered;
    },
  },

  async $transaction(arg: any) {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    if (typeof arg === "function") {
      return arg(mockPrisma);
    }
    throw new Error("Invalid transaction argument");
  },
};

// Set globally so prisma.ts automatically uses this mock
(globalThis as any).prismaGlobal = mockPrisma;

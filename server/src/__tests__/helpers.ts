import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Role, Species, Sex, Size, AgeCategory, Modality, AnimalStatus, VerificationStatus } from "@prisma/client";
import { db, MockUser, MockAnimal, MockInstitutionalProfile } from "./mockDb";

export const TEST_JWT_SECRET = process.env.JWT_SECRET || "cumpa_test_jwt_secret_key_1234567890";

export function generateTestToken(user: { id: string; email: string; role: Role }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    TEST_JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function seedUser(overrides: Partial<MockUser> = {}): Promise<MockUser> {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(overrides.passwordHash || "Password123!", salt);

  const user: MockUser = {
    id: overrides.id || crypto.randomUUID(),
    email: overrides.email || `user_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
    passwordHash,
    googleId: overrides.googleId || null,
    role: overrides.role || Role.PARTICULAR,
    name: overrides.name || "Test User",
    phone: overrides.phone || "1123456789",
    province: overrides.province || "Buenos Aires",
    city: overrides.city || "La Plata",
    address: overrides.address || "Calle 123",
    avatarUrl: overrides.avatarUrl || null,
    isEmailVerified: overrides.isEmailVerified !== undefined ? overrides.isEmailVerified : true,
    verificationToken: overrides.verificationToken || null,
    resetPasswordToken: overrides.resetPasswordToken || null,
    resetPasswordExpires: overrides.resetPasswordExpires || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  db.users.push(user);
  return user;
}

export function seedInstitutionalProfile(
  userId: string,
  overrides: Partial<MockInstitutionalProfile> = {}
): MockInstitutionalProfile {
  const profile: MockInstitutionalProfile = {
    id: overrides.id || crypto.randomUUID(),
    userId,
    legalName: overrides.legalName || "Refugio Patitas Felices",
    cuit: overrides.cuit || "30-12345678-9",
    verificationStatus: overrides.verificationStatus || VerificationStatus.APROBADA,
    verificationNotes: overrides.verificationNotes || null,
    verifiedAt: overrides.verifiedAt || new Date(),
    verifiedByAdminId: overrides.verifiedByAdminId || null,
    documentUrl: overrides.documentUrl || "https://example.com/cuit.pdf",
    websiteUrl: overrides.websiteUrl || "https://patitasfelices.org",
    instagramUrl: overrides.instagramUrl || "https://instagram.com/patitasfelices",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  db.institutionalProfiles.push(profile);
  return profile;
}

export function seedAnimal(
  publisherId: string,
  overrides: Partial<MockAnimal> = {}
): MockAnimal {
  const animalId = overrides.id || crypto.randomUUID();
  const animal: MockAnimal = {
    id: animalId,
    publisherId,
    name: overrides.name || "Firulais",
    species: overrides.species || Species.PERRO,
    breed: overrides.breed || "Mestizo",
    sex: overrides.sex || Sex.MACHO,
    size: overrides.size || Size.MEDIANO,
    ageCategory: overrides.ageCategory || AgeCategory.ADULTO,
    approximateAgeMonths: overrides.approximateAgeMonths || 24,
    description: overrides.description || "Perro muy cariñoso, ideal para familias con patio.",
    healthDetails: overrides.healthDetails || "Desparasitado y con vacunas al día.",
    isNeutered: overrides.isNeutered !== undefined ? overrides.isNeutered : true,
    isVaccinated: overrides.isVaccinated !== undefined ? overrides.isVaccinated : true,
    isDewormed: overrides.isDewormed !== undefined ? overrides.isDewormed : true,
    specialNeeds: overrides.specialNeeds !== undefined ? overrides.specialNeeds : false,
    specialNeedsDescription: overrides.specialNeedsDescription || null,
    modality: overrides.modality || Modality.ADOPCION_DEFINITIVA,
    status: overrides.status || AnimalStatus.DISPONIBLE,
    province: overrides.province || "Buenos Aires",
    city: overrides.city || "La Plata",
    createdAt: overrides.createdAt || new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  db.animals.push(animal);

  // Add at least one default image
  db.animalImages.push({
    id: crypto.randomUUID(),
    animalId: animal.id,
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
    publicId: "cumpa/animales/mock_img_1",
    isMain: true,
    order: 0,
    createdAt: new Date(),
  });

  return animal;
}

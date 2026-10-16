import type {
  AnimalSpecies,
  AnimalSex,
  AnimalSize,
  AnimalAgeCategory,
  AnimalModality,
  AnimalStatus,
} from '@/features/exploration/types/exploration.types';

export interface AnimalImage {
  id: string;
  url: string;
  publicId: string;
  isMain: boolean;
  order: number;
}

export interface CreateAnimalPayload {
  name: string;
  species: AnimalSpecies;
  breed?: string;
  sex: AnimalSex;
  size: AnimalSize;
  ageCategory: AnimalAgeCategory;
  approximateAgeMonths?: number;
  description: string;
  healthDetails?: string;
  isNeutered?: boolean;
  isVaccinated?: boolean;
  isDewormed?: boolean;
  specialNeeds?: boolean;
  specialNeedsDescription?: string;
  modality: AnimalModality;
  province: string;
  city: string;
  images: File[];
}

export interface CreateAnimalResponse {
  message: string;
  id: string;
  name: string;
  status: AnimalStatus;
}

export interface MyPublicationItem {
  id: string;
  name: string;
  species: AnimalSpecies;
  breed?: string | null;
  sex: AnimalSex;
  size: AnimalSize;
  ageCategory: AnimalAgeCategory;
  approximateAgeMonths?: number | null;
  description: string;
  healthDetails?: string | null;
  isNeutered: boolean;
  isVaccinated: boolean;
  isDewormed: boolean;
  specialNeeds: boolean;
  specialNeedsDescription?: string | null;
  modality: AnimalModality;
  status: AnimalStatus;
  province: string;
  city: string;
  images: AnimalImage[];
  pendingRequestsCount: number;
  createdAt: string;
  updatedAt: string;
}

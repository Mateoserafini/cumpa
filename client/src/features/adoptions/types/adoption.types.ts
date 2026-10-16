import type { AnimalModality, AnimalSpecies } from '@/features/exploration/types/exploration.types';

export type RequestStatus = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';

export interface SubmitApplicationPayload {
  animalId: string;
  type: Extract<AnimalModality, 'ADOPCION_DEFINITIVA' | 'TRANSITO_TEMPORARIO'>;
  message: string;
  phone: string;
  address?: string;
  hasOtherPets: boolean;
  hasYard: boolean;
  housingType?: string;
  landlordAllowsPets?: boolean;
}

export interface SubmitApplicationResponse {
  message: string;
  requestId: string;
  status: RequestStatus;
}

export interface AdoptionRequestItem {
  id: string;
  animalId: string;
  applicantId: string;
  type: Extract<AnimalModality, 'ADOPCION_DEFINITIVA' | 'TRANSITO_TEMPORARIO'>;
  status: RequestStatus;
  message: string;
  phone: string;
  address?: string | null;
  hasOtherPets: boolean;
  hasYard: boolean;
  housingType?: string | null;
  landlordAllowsPets?: boolean | null;
  rejectionReason?: string | null;
  createdAt: string;
  animal?: {
    id: string;
    name: string;
    species: AnimalSpecies;
    mainImage?: string | null;
    status: string;
  };
  applicant?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

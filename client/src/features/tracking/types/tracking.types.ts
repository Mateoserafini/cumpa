import type { AnimalSpecies } from '@/features/exploration/types/exploration.types';

export type FollowUpStatus = 'ACTIVO' | 'COMPLETADO' | 'EN_MORA' | 'ALERTA_DISPARADA';

export type ReportStatus = 'PENDIENTE' | 'CUMPLIDO' | 'ATRASADO' | 'INCUMPLIDO';

export interface FollowUpReport {
  id: string;
  monthNumber: number;
  dueDate: string;
  status: ReportStatus;
  submittedAt?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  reviewedByGuardian?: boolean;
  guardianFeedback?: string | null;
}

export interface FollowUpItem {
  id: string;
  animalId: string;
  adopterId: string;
  guardianId: string;
  status: FollowUpStatus;
  startDate: string;
  endDate: string;
  animal: {
    id: string;
    name: string;
    species: AnimalSpecies;
    mainImage?: string | null;
  };
  adopter: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    city?: string | null;
    province?: string | null;
  };
  reports: FollowUpReport[];
  createdAt: string;
}

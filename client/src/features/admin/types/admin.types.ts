export interface AdminStats {
  totalUsers: number;
  totalActiveAnimals: number;
  totalAdoptionsCompleted: number;
  activeFollowUps: number;
  complianceRatePercentage: number;
}

export interface PendingInstitution {
  id: string;
  userId: string;
  legalName: string;
  cuit: string;
  verificationStatus: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  verificationNotes?: string | null;
  documentUrl?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    province: string;
    city: string;
    role: string;
    createdAt: string;
  };
}

export interface AdminReportItem {
  id: string;
  reporterId: string;
  targetType: 'ANIMAL' | 'USER';
  targetId: string;
  reason: 'DATOS_FALSOS' | 'MALTRATO' | 'ESTAFA' | 'SPAM' | 'OTRO';
  description: string;
  status: 'PENDIENTE' | 'EN_REVISION' | 'RESUELTO' | 'DESESTIMADO';
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  reporter: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface PaginatedReports {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: AdminReportItem[];
}


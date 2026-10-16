import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  isEmailVerified: boolean;
}

export interface JwtUserPayload {
  id: string;
  email: string;
  role: Role;
}

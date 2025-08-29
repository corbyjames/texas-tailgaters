export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  role: UserRole;
  isAdmin: boolean; // Deprecated, use role instead
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isAdmin: boolean; // Deprecated, use role instead
}

export interface DietaryRestriction {
  id: string;
  name: string;
  category: 'dietary' | 'allergy';
  description?: string;
}


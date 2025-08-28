export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

export interface DietaryRestriction {
  id: string;
  name: string;
  category: 'dietary' | 'allergy';
  description?: string;
}


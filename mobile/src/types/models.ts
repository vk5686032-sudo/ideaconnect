export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export interface Avatar {
  public_id?: string;
  url?: string;
}

export interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface Experience {
  company?: string;
  position?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export type UserRole = 'user' | 'mentor' | 'admin';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  avatar?: Avatar | null;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: Education[];
  experience?: Experience[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  role: UserRole;
  isVerified?: boolean;
  isMentorApproved?: boolean;
  reputation?: number;
  isActive?: boolean;
  ideasCreated?: string[];
  projectsJoined?: string[];
}

export interface AuthPayload {
  user: User;
  token: string;
  refreshToken: string;
}

// Redux types
export type { RootState, AppDispatch } from '../store';

// Navigation types
export type { RootStackParamList, TabParamList } from '../navigation/types';

// Form types
export type { LoginFormData, RegisterFormData } from '../utils/formValidation';

// Config types
export type { Theme, EnvConfig } from '../utils/config';

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

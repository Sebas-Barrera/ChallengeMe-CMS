/**
 * Tipos comunes utilizados en toda la aplicación
 */

// ============================================
// FORMULARIOS
// ============================================

export interface TranslationField {
  language_code: string;
  [key: string]: string;
}

export interface FormError {
  field: string;
  message: string;
}

export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================
// UI
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

// ============================================
// NAVEGACIÓN
// ============================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
}

// ============================================
// AUTENTICACIÓN
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============================================
// API
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// UTILIDADES
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

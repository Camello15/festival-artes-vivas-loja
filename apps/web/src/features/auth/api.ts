import { api } from '../../lib/api';

export type UserRole = 'PUBLIC' | 'ARTIST' | 'ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function register(input: { name: string; email: string; password: string }) {
  return api.post<AuthResponse>('/auth/register', input);
}

export function login(input: { email: string; password: string }) {
  return api.post<AuthResponse>('/auth/login', input);
}

export function getCurrentUser() {
  return api.get<{ user: AuthUser }>('/auth/me');
}

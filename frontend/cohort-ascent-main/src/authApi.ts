import api from './api';

export interface LoginRequest {
  empId: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  userId: number;
  empId: string;
  name: string;
  email: string;
  role: string;
  token?: string; // It was in backend, might as well add it
}

export const authApi = {
  login: (credentials: LoginRequest) => api.post<AuthResponse>('/auth/login', credentials),
};
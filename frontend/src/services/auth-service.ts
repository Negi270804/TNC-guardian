import { apiClient } from './api-client';
import { User, TokenResponse } from '@/types';

export const authService = {
  async register(email: string, password: string, fullName?: string): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

import { apiClient } from './api-client';
import { User, TokenResponse } from '@/types';
import { API_ROUTES } from '@/config/api-routes';

export const authService = {
  async register(email: string, password: string, fullName?: string): Promise<User> {
    const response = await apiClient.post<User>(API_ROUTES.AUTH.REGISTER, {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(API_ROUTES.AUTH.LOGIN, {
      email,
      password,
    });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>(API_ROUTES.AUTH.ME);
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  },

  async resetPassword(payload: any): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(API_ROUTES.AUTH.RESET_PASSWORD, payload);
    return response.data;
  },
};

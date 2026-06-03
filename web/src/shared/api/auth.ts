import { apiClient } from "./api-client";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    apiClient.post<TokenPair>("/auth/register", { email, password, displayName }),

  login: (email: string, password: string) =>
    apiClient.post<TokenPair>("/auth/login", { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenPair>("/auth/refresh", { refreshToken }),

  logout: (accessToken: string) =>
    apiClient.delete<void>("/auth/logout", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

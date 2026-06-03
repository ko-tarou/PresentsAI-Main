import { apiClient } from "./api-client";

export interface Presentation {
  id: string;
  ownerId: string;
  title: string;
  thumbnailUrl: string;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationsListResponse {
  items: Presentation[];
  total: number;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const presentationsApi = {
  list: (token: string) =>
    apiClient.get<PresentationsListResponse>("/presentations", {
      headers: authHeaders(token),
    }),
  create: (token: string, title: string) =>
    apiClient.post<Presentation>("/presentations", { title }, {
      headers: authHeaders(token),
    }),
  get: (token: string, id: string) =>
    apiClient.get<Presentation>(`/presentations/${id}`, {
      headers: authHeaders(token),
    }),
  update: (token: string, id: string, title: string) =>
    apiClient.put<Presentation>(`/presentations/${id}`, { title }, {
      headers: authHeaders(token),
    }),
  delete: (token: string, id: string) =>
    apiClient.delete<void>(`/presentations/${id}`, {
      headers: authHeaders(token),
    }),
};

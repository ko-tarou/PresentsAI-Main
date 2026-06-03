import { apiClient } from "./api-client";

export type MemberRole = "owner" | "editor" | "viewer";

export interface Member {
  id: string;
  presentationId: string;
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  createdAt: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const membersApi = {
  list: (token: string, presentationId: string) =>
    apiClient.get<{ items: Member[] }>(`/presentations/${presentationId}/members`, {
      headers: authHeaders(token),
    }),

  invite: (token: string, presentationId: string, email: string, role: MemberRole) =>
    apiClient.post<Member>(`/presentations/${presentationId}/members`, { email, role }, {
      headers: authHeaders(token),
    }),

  updateRole: (token: string, presentationId: string, userId: string, role: MemberRole) =>
    apiClient.put<void>(`/presentations/${presentationId}/members/${userId}`, { role }, {
      headers: authHeaders(token),
    }),

  remove: (token: string, presentationId: string, userId: string) =>
    apiClient.delete<void>(`/presentations/${presentationId}/members/${userId}`, {
      headers: authHeaders(token),
    }),
};

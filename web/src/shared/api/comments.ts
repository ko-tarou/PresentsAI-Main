import { apiClient } from "./api-client";
import type { Comment, CreateCommentInput } from "@shared/types/comment";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const commentsApi = {
  list: (token: string, presentationId: string) =>
    apiClient.get<{ items: Comment[] }>(`/presentations/${presentationId}/comments`, {
      headers: authHeaders(token),
    }),

  create: (token: string, presentationId: string, input: CreateCommentInput) =>
    apiClient.post<Comment>(`/presentations/${presentationId}/comments`, input, {
      headers: authHeaders(token),
    }),
};

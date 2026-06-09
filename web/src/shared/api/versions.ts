import { apiClient } from "./api-client";
import type { SlideVersion } from "@shared/types/version";
import type { SlideContent } from "@shared/types/slide";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Slide versions are scoped to a single slide (see version_handler.go), so
// every call carries both the presentation id and the slide id. Riding on
// `apiClient` keeps these on the shared token auto-refresh path (members.ts).
export const versionsApi = {
  list: (token: string, presentationId: string, slideId: string) =>
    apiClient.get<{ items: SlideVersion[] }>(
      `/presentations/${presentationId}/slides/${slideId}/versions`,
      { headers: authHeaders(token) }
    ),

  create: (token: string, presentationId: string, slideId: string, content: SlideContent) =>
    apiClient.post<SlideVersion>(
      `/presentations/${presentationId}/slides/${slideId}/versions`,
      { content },
      { headers: authHeaders(token) }
    ),

  restore: (token: string, presentationId: string, slideId: string, versionId: string) =>
    apiClient.post<{ restored: string }>(
      `/presentations/${presentationId}/slides/${slideId}/versions/${versionId}/restore`,
      {},
      { headers: authHeaders(token) }
    ),
};

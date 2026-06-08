import { apiClient } from "./api-client";
import type { Slide, SlideContent, SlideTransition, ElementAnimation } from "@shared/types/slide";

/** Slide-level metadata that can be persisted independently of canvas content. */
export interface SlideMetaUpdate {
  transition?: SlideTransition;
  animations?: ElementAnimation[];
  layoutRef?: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const slidesApi = {
  list: (token: string, presentationId: string) =>
    apiClient.get<{ items: Slide[] }>(`/presentations/${presentationId}/slides`, {
      headers: authHeaders(token),
    }),
  get: (token: string, presentationId: string, slideId: string) =>
    apiClient.get<Slide>(`/presentations/${presentationId}/slides/${slideId}`, {
      headers: authHeaders(token),
    }),
  create: (token: string, presentationId: string) =>
    apiClient.post<Slide>(`/presentations/${presentationId}/slides`, {}, {
      headers: authHeaders(token),
    }),
  updateContent: (token: string, presentationId: string, slideId: string, content: SlideContent) =>
    apiClient.put<Slide>(`/presentations/${presentationId}/slides/${slideId}`, { content }, {
      headers: authHeaders(token),
    }),
  delete: (token: string, presentationId: string, slideId: string) =>
    apiClient.delete<void>(`/presentations/${presentationId}/slides/${slideId}`, {
      headers: authHeaders(token),
    }),
  reorder: (token: string, presentationId: string, positions: Record<string, number>) =>
    apiClient.put<void>(`/presentations/${presentationId}/slides/reorder`, { positions }, {
      headers: authHeaders(token),
    }),
  updateNotes: (token: string, presentationId: string, slideId: string, notes: string) =>
    apiClient.patch<Slide>(`/presentations/${presentationId}/slides/${slideId}/notes`, { notes }, {
      headers: authHeaders(token),
    }),
  updateMeta: (token: string, presentationId: string, slideId: string, meta: SlideMetaUpdate) =>
    apiClient.patch<Slide>(`/presentations/${presentationId}/slides/${slideId}/meta`, meta, {
      headers: authHeaders(token),
    }),
};

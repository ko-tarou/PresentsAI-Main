import type { SlideContent } from "@shared/types/slide";

// Mirrors the backend `postgres.SlideVersionModel` returned by
// GET/POST /presentations/:id/slides/:slideId/versions. That struct carries no
// JSON tags, so Go serializes the Go field names verbatim (PascalCase) — keep
// these keys aligned with
// services/api/internal/infrastructure/postgres/models.go.
export interface SlideVersion {
  ID: string;
  SlideID: string;
  Version: number;
  Content: SlideContent;
  AuthorID: string;
  CreatedAt: string;
}

// Mirrors the backend `postgres.CommentModel` returned by
// GET/POST /presentations/:id/comments. That struct carries no JSON tags, so
// Go serializes the Go field names verbatim (PascalCase) — keep these keys
// aligned with services/api/internal/infrastructure/postgres/models.go.
export interface Comment {
  ID: string;
  PresentationID: string;
  SlideID: string;
  AuthorID: string;
  AuthorName: string;
  Body: string;
  CreatedAt: string;
}

// Request body for creating a comment (decoded by HandleCreate, json-tagged).
export interface CreateCommentInput {
  body: string;
  slideId?: string;
}

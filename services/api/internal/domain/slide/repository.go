package slide

import "context"

type Repository interface {
	Create(ctx context.Context, s *Slide) error
	FindByID(ctx context.Context, id ID) (*Slide, error)
	FindByPresentation(ctx context.Context, presentationID string) ([]*Slide, error)
	Update(ctx context.Context, s *Slide) error
	Delete(ctx context.Context, id ID) error
	ReorderSlides(ctx context.Context, presentationID string, positions map[string]int) error
}

package presentation

import "context"

type Repository interface {
	Create(ctx context.Context, p *Presentation) error
	FindByID(ctx context.Context, id ID) (*Presentation, error)
	FindByOwner(ctx context.Context, ownerID string, limit, offset int) ([]*Presentation, int64, error)
	Update(ctx context.Context, p *Presentation) error
	Delete(ctx context.Context, id ID) error
}

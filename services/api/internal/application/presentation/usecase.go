package presentation

import (
	"context"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainSlide "github.com/ko-tarou/presentsai/services/api/internal/domain/slide"
	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type UseCase struct {
	repo      domainPresentation.Repository
	slideRepo domainSlide.Repository
}

func NewUseCase(repo domainPresentation.Repository, slideRepo domainSlide.Repository) *UseCase {
	return &UseCase{repo: repo, slideRepo: slideRepo}
}

type CreateInput struct {
	OwnerID string
	Title   string
}

func (uc *UseCase) Create(ctx context.Context, in CreateInput) (*domainPresentation.Presentation, error) {
	p := domainPresentation.New(domainUser.ID(in.OwnerID), in.Title)
	if err := uc.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	s := domainSlide.New(p.ID, 0)
	_ = uc.slideRepo.Create(ctx, s)
	return p, nil
}

func (uc *UseCase) List(ctx context.Context, ownerID string, limit, offset int) ([]*domainPresentation.Presentation, int64, error) {
	return uc.repo.FindByOwner(ctx, ownerID, limit, offset)
}

func (uc *UseCase) Get(ctx context.Context, id, ownerID string) (*domainPresentation.Presentation, error) {
	p, err := uc.repo.FindByID(ctx, domainPresentation.ID(id))
	if err != nil {
		return nil, err
	}
	if string(p.OwnerID) != ownerID {
		return nil, sharedErr.ErrForbidden
	}
	return p, nil
}

func (uc *UseCase) Update(ctx context.Context, id, ownerID, title string) (*domainPresentation.Presentation, error) {
	p, err := uc.Get(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	p.Title = title
	return p, uc.repo.Update(ctx, p)
}

func (uc *UseCase) Delete(ctx context.Context, id, ownerID string) error {
	if _, err := uc.Get(ctx, id, ownerID); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, domainPresentation.ID(id))
}

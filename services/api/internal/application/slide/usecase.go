package slide

import (
	"context"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainSlide "github.com/ko-tarou/presentsai/services/api/internal/domain/slide"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type UseCase struct {
	repo             domainSlide.Repository
	presentationRepo domainPresentation.Repository
}

func NewUseCase(repo domainSlide.Repository, presentationRepo domainPresentation.Repository) *UseCase {
	return &UseCase{repo: repo, presentationRepo: presentationRepo}
}

func (uc *UseCase) ownerCheck(ctx context.Context, presentationID, ownerID string) error {
	p, err := uc.presentationRepo.FindByID(ctx, domainPresentation.ID(presentationID))
	if err != nil {
		return err
	}
	if string(p.OwnerID) != ownerID {
		return sharedErr.ErrForbidden
	}
	return nil
}

func (uc *UseCase) List(ctx context.Context, presentationID, ownerID string) ([]*domainSlide.Slide, error) {
	if err := uc.ownerCheck(ctx, presentationID, ownerID); err != nil {
		return nil, err
	}
	return uc.repo.FindByPresentation(ctx, presentationID)
}

func (uc *UseCase) Get(ctx context.Context, id, ownerID string) (*domainSlide.Slide, error) {
	s, err := uc.repo.FindByID(ctx, domainSlide.ID(id))
	if err != nil {
		return nil, err
	}
	if err := uc.ownerCheck(ctx, string(s.PresentationID), ownerID); err != nil {
		return nil, err
	}
	return s, nil
}

func (uc *UseCase) Create(ctx context.Context, presentationID, ownerID string) (*domainSlide.Slide, error) {
	if err := uc.ownerCheck(ctx, presentationID, ownerID); err != nil {
		return nil, err
	}
	existing, err := uc.repo.FindByPresentation(ctx, presentationID)
	if err != nil {
		return nil, err
	}
	s := domainSlide.New(domainPresentation.ID(presentationID), len(existing))
	return s, uc.repo.Create(ctx, s)
}

func (uc *UseCase) UpdateContent(ctx context.Context, id, ownerID string, content domainSlide.Content) (*domainSlide.Slide, error) {
	s, err := uc.Get(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	s.Content = content
	return s, uc.repo.Update(ctx, s)
}

// SlideMeta carries the slide-level presentation metadata that can be updated
// independently of the canvas content. Nil fields are left unchanged.
type SlideMeta struct {
	Transition *domainSlide.Transition
	Animations []domainSlide.ElementAnimation
	LayoutRef  *string
}

// UpdateMeta persists slide-level transition / animations / layoutRef.
// Only the non-nil fields of meta are applied; the rest are preserved.
func (uc *UseCase) UpdateMeta(ctx context.Context, id, ownerID string, meta SlideMeta) (*domainSlide.Slide, error) {
	s, err := uc.Get(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	if meta.Transition != nil {
		// A transition of type "none" clears the stored transition.
		if meta.Transition.Type == "" || meta.Transition.Type == "none" {
			s.Transition = nil
		} else {
			s.Transition = meta.Transition
		}
	}
	if meta.Animations != nil {
		s.Animations = meta.Animations
	}
	if meta.LayoutRef != nil {
		s.LayoutRef = *meta.LayoutRef
	}
	return s, uc.repo.Update(ctx, s)
}

func (uc *UseCase) UpdateNotes(ctx context.Context, id, ownerID, notes string) (*domainSlide.Slide, error) {
	s, err := uc.Get(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	s.Notes = notes
	return s, uc.repo.Update(ctx, s)
}

func (uc *UseCase) Delete(ctx context.Context, id, ownerID string) error {
	if _, err := uc.Get(ctx, id, ownerID); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, domainSlide.ID(id))
}

func (uc *UseCase) Reorder(ctx context.Context, presentationID, ownerID string, positions map[string]int) error {
	if err := uc.ownerCheck(ctx, presentationID, ownerID); err != nil {
		return err
	}
	return uc.repo.ReorderSlides(ctx, presentationID, positions)
}

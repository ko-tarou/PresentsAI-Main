package slide

import (
	"context"
	"errors"
	"strconv"
	"testing"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainSlide "github.com/ko-tarou/presentsai/services/api/internal/domain/slide"
	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

const (
	ownerID    = "owner-1"
	strangerID = "stranger-1"
	ownedPres  = "pres-owned"
	otherPres  = "pres-other"
)

// fakePresentationRepo serves two presentations: one owned by ownerID, one by stranger.
type fakePresentationRepo struct {
	pres map[domainPresentation.ID]*domainPresentation.Presentation
}

func newFakePresentationRepo() *fakePresentationRepo {
	return &fakePresentationRepo{
		pres: map[domainPresentation.ID]*domainPresentation.Presentation{
			domainPresentation.ID(ownedPres): {ID: domainPresentation.ID(ownedPres), OwnerID: domainUser.ID(ownerID)},
			domainPresentation.ID(otherPres): {ID: domainPresentation.ID(otherPres), OwnerID: domainUser.ID(strangerID)},
		},
	}
}

func (r *fakePresentationRepo) Create(ctx context.Context, p *domainPresentation.Presentation) error {
	return nil
}
func (r *fakePresentationRepo) FindByID(ctx context.Context, id domainPresentation.ID) (*domainPresentation.Presentation, error) {
	if p, ok := r.pres[id]; ok {
		return p, nil
	}
	return nil, sharedErr.ErrNotFound
}
func (r *fakePresentationRepo) FindByOwner(ctx context.Context, ownerID string, limit, offset int) ([]*domainPresentation.Presentation, int64, error) {
	return nil, 0, nil
}
func (r *fakePresentationRepo) Update(ctx context.Context, p *domainPresentation.Presentation) error {
	return nil
}
func (r *fakePresentationRepo) Delete(ctx context.Context, id domainPresentation.ID) error {
	return nil
}

// fakeSlideRepo is an in-memory slide Repository.
type fakeSlideRepo struct {
	byID            map[domainSlide.ID]*domainSlide.Slide
	nextID          int
	reorderCalls    int
	lastReorderPres string
	lastPositions   map[string]int
}

func newFakeSlideRepo() *fakeSlideRepo {
	return &fakeSlideRepo{byID: map[domainSlide.ID]*domainSlide.Slide{}}
}

func (r *fakeSlideRepo) Create(ctx context.Context, s *domainSlide.Slide) error {
	r.nextID++
	s.ID = domainSlide.ID("slide-" + strconv.Itoa(r.nextID))
	r.byID[s.ID] = s
	return nil
}
func (r *fakeSlideRepo) FindByID(ctx context.Context, id domainSlide.ID) (*domainSlide.Slide, error) {
	if s, ok := r.byID[id]; ok {
		return s, nil
	}
	return nil, sharedErr.ErrNotFound
}
func (r *fakeSlideRepo) FindByPresentation(ctx context.Context, presentationID string) ([]*domainSlide.Slide, error) {
	var out []*domainSlide.Slide
	for _, s := range r.byID {
		if string(s.PresentationID) == presentationID {
			out = append(out, s)
		}
	}
	return out, nil
}
func (r *fakeSlideRepo) Update(ctx context.Context, s *domainSlide.Slide) error {
	r.byID[s.ID] = s
	return nil
}
func (r *fakeSlideRepo) Delete(ctx context.Context, id domainSlide.ID) error {
	delete(r.byID, id)
	return nil
}
func (r *fakeSlideRepo) ReorderSlides(ctx context.Context, presentationID string, positions map[string]int) error {
	r.reorderCalls++
	r.lastReorderPres = presentationID
	r.lastPositions = positions
	return nil
}

// seed inserts a slide directly into the repo for the given presentation.
func (r *fakeSlideRepo) seed(presID string, position int) *domainSlide.Slide {
	r.nextID++
	s := &domainSlide.Slide{
		ID:             domainSlide.ID("slide-" + strconv.Itoa(r.nextID)),
		PresentationID: domainPresentation.ID(presID),
		Position:       position,
	}
	r.byID[s.ID] = s
	return s
}

func newUC() (*UseCase, *fakeSlideRepo) {
	srepo := newFakeSlideRepo()
	return NewUseCase(srepo, newFakePresentationRepo()), srepo
}

func TestOwnershipGuard(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	// a slide belonging to a presentation owned by stranger
	s := srepo.seed(otherPres, 0)

	t.Run("Get on foreign slide", func(t *testing.T) {
		_, err := uc.Get(ctx, string(s.ID), ownerID)
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
	t.Run("List on foreign presentation", func(t *testing.T) {
		_, err := uc.List(ctx, otherPres, ownerID)
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
	t.Run("Create on foreign presentation", func(t *testing.T) {
		_, err := uc.Create(ctx, otherPres, ownerID)
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
	t.Run("Delete on foreign slide", func(t *testing.T) {
		err := uc.Delete(ctx, string(s.ID), ownerID)
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
	t.Run("Reorder on foreign presentation", func(t *testing.T) {
		err := uc.Reorder(ctx, otherPres, ownerID, map[string]int{})
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
}

func TestCreate(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	// pre-existing slides at positions 0 and 1
	srepo.seed(ownedPres, 0)
	srepo.seed(ownedPres, 1)

	s, err := uc.Create(ctx, ownedPres, ownerID)
	if err != nil {
		t.Fatalf("Create returned error: %v", err)
	}
	if s.Position != 2 {
		t.Fatalf("new slide position = %d, want 2 (len of existing)", s.Position)
	}
	if string(s.PresentationID) != ownedPres {
		t.Fatalf("presentation id = %q, want %q", s.PresentationID, ownedPres)
	}
	if _, ok := srepo.byID[s.ID]; !ok {
		t.Fatal("slide not persisted")
	}
}

func TestUpdateContent(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	s := srepo.seed(ownedPres, 0)

	newContent := domainSlide.Content{"version": "6.0.0", "objects": []interface{}{"rect"}}
	updated, err := uc.UpdateContent(ctx, string(s.ID), ownerID, newContent)
	if err != nil {
		t.Fatalf("UpdateContent returned error: %v", err)
	}
	if updated.Content["objects"] == nil {
		t.Fatal("content not updated")
	}
	if srepo.byID[s.ID].Content["version"] != "6.0.0" {
		t.Fatal("content not persisted")
	}
}

func TestUpdateMeta(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	s := srepo.seed(ownedPres, 0)

	layout := "title"
	updated, err := uc.UpdateMeta(ctx, string(s.ID), ownerID, SlideMeta{
		Transition: &domainSlide.Transition{Type: "fade", DurationMs: 300},
		Animations: []domainSlide.ElementAnimation{{TargetID: "o1", Type: "fadeIn", Order: 0}},
		LayoutRef:  &layout,
	})
	if err != nil {
		t.Fatalf("UpdateMeta returned error: %v", err)
	}
	if updated.Transition == nil || updated.Transition.Type != "fade" || updated.Transition.DurationMs != 300 {
		t.Fatalf("transition not applied: %+v", updated.Transition)
	}
	if len(updated.Animations) != 1 || updated.Animations[0].Type != "fadeIn" {
		t.Fatalf("animations not applied: %+v", updated.Animations)
	}
	if updated.LayoutRef != "title" {
		t.Fatalf("layoutRef = %q, want title", updated.LayoutRef)
	}
	// Persisted to the repo.
	stored := srepo.byID[s.ID]
	if stored.Transition == nil || stored.Transition.Type != "fade" {
		t.Fatal("transition not persisted")
	}
}

func TestUpdateMetaPartialPreservesOtherFields(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	s := srepo.seed(ownedPres, 0)
	s.Transition = &domainSlide.Transition{Type: "zoom", DurationMs: 500}
	s.LayoutRef = "blank"

	// Update only animations; transition and layoutRef must be preserved.
	if _, err := uc.UpdateMeta(ctx, string(s.ID), ownerID, SlideMeta{
		Animations: []domainSlide.ElementAnimation{{TargetID: "x", Type: "zoomIn", Order: 1}},
	}); err != nil {
		t.Fatalf("UpdateMeta returned error: %v", err)
	}
	stored := srepo.byID[s.ID]
	if stored.Transition == nil || stored.Transition.Type != "zoom" {
		t.Fatalf("transition not preserved: %+v", stored.Transition)
	}
	if stored.LayoutRef != "blank" {
		t.Fatalf("layoutRef not preserved: %q", stored.LayoutRef)
	}
	if len(stored.Animations) != 1 {
		t.Fatalf("animations not applied: %+v", stored.Animations)
	}
}

func TestUpdateMetaNoneClearsTransition(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	s := srepo.seed(ownedPres, 0)
	s.Transition = &domainSlide.Transition{Type: "fade", DurationMs: 300}

	if _, err := uc.UpdateMeta(ctx, string(s.ID), ownerID, SlideMeta{
		Transition: &domainSlide.Transition{Type: "none"},
	}); err != nil {
		t.Fatalf("UpdateMeta returned error: %v", err)
	}
	if srepo.byID[s.ID].Transition != nil {
		t.Fatalf("transition not cleared: %+v", srepo.byID[s.ID].Transition)
	}
}

func TestUpdateMetaForbiddenOnForeignSlide(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	s := srepo.seed(otherPres, 0)

	_, err := uc.UpdateMeta(ctx, string(s.ID), ownerID, SlideMeta{
		Transition: &domainSlide.Transition{Type: "fade"},
	})
	if !errors.Is(err, sharedErr.ErrForbidden) {
		t.Fatalf("err = %v, want ErrForbidden", err)
	}
}

func TestDelete(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	s := srepo.seed(ownedPres, 0)

	if err := uc.Delete(ctx, string(s.ID), ownerID); err != nil {
		t.Fatalf("Delete returned error: %v", err)
	}
	if _, ok := srepo.byID[s.ID]; ok {
		t.Fatal("slide not deleted")
	}
}

func TestList(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	srepo.seed(ownedPres, 0)
	srepo.seed(ownedPres, 1)
	srepo.seed(otherPres, 0) // different presentation, must not appear

	got, err := uc.List(ctx, ownedPres, ownerID)
	if err != nil {
		t.Fatalf("List returned error: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 slides, got %d", len(got))
	}
}

func TestReorder(t *testing.T) {
	ctx := context.Background()
	uc, srepo := newUC()
	positions := map[string]int{"slide-a": 1, "slide-b": 0}

	if err := uc.Reorder(ctx, ownedPres, ownerID, positions); err != nil {
		t.Fatalf("Reorder returned error: %v", err)
	}
	if srepo.reorderCalls != 1 {
		t.Fatalf("expected 1 ReorderSlides call, got %d", srepo.reorderCalls)
	}
	if srepo.lastReorderPres != ownedPres {
		t.Fatalf("reorder presentation = %q, want %q", srepo.lastReorderPres, ownedPres)
	}
	if len(srepo.lastPositions) != 2 {
		t.Fatalf("expected 2 positions forwarded, got %d", len(srepo.lastPositions))
	}
}

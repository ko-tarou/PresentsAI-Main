package presentation

import (
	"context"
	"errors"
	"strconv"
	"testing"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainSlide "github.com/ko-tarou/presentsai/services/api/internal/domain/slide"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

// fakePresentationRepo is an in-memory presentation Repository that assigns IDs.
type fakePresentationRepo struct {
	byID   map[domainPresentation.ID]*domainPresentation.Presentation
	nextID int
}

func newFakePresentationRepo() *fakePresentationRepo {
	return &fakePresentationRepo{byID: map[domainPresentation.ID]*domainPresentation.Presentation{}}
}

func (r *fakePresentationRepo) Create(ctx context.Context, p *domainPresentation.Presentation) error {
	r.nextID++
	p.ID = domainPresentation.ID("pres-" + strconv.Itoa(r.nextID))
	r.byID[p.ID] = p
	return nil
}
func (r *fakePresentationRepo) FindByID(ctx context.Context, id domainPresentation.ID) (*domainPresentation.Presentation, error) {
	if p, ok := r.byID[id]; ok {
		return p, nil
	}
	return nil, sharedErr.ErrNotFound
}
func (r *fakePresentationRepo) FindByOwner(ctx context.Context, ownerID string, limit, offset int) ([]*domainPresentation.Presentation, int64, error) {
	var out []*domainPresentation.Presentation
	for _, p := range r.byID {
		if string(p.OwnerID) == ownerID {
			out = append(out, p)
		}
	}
	return out, int64(len(out)), nil
}
func (r *fakePresentationRepo) Update(ctx context.Context, p *domainPresentation.Presentation) error {
	r.byID[p.ID] = p
	return nil
}
func (r *fakePresentationRepo) Delete(ctx context.Context, id domainPresentation.ID) error {
	delete(r.byID, id)
	return nil
}

// fakeSlideRepo records Create calls so the auto-first-slide behaviour can be asserted.
type fakeSlideRepo struct {
	created []*domainSlide.Slide
}

func (r *fakeSlideRepo) Create(ctx context.Context, s *domainSlide.Slide) error {
	r.created = append(r.created, s)
	return nil
}
func (r *fakeSlideRepo) FindByID(ctx context.Context, id domainSlide.ID) (*domainSlide.Slide, error) {
	return nil, sharedErr.ErrNotFound
}
func (r *fakeSlideRepo) FindByPresentation(ctx context.Context, presentationID string) ([]*domainSlide.Slide, error) {
	return nil, nil
}
func (r *fakeSlideRepo) Update(ctx context.Context, s *domainSlide.Slide) error { return nil }
func (r *fakeSlideRepo) Delete(ctx context.Context, id domainSlide.ID) error    { return nil }
func (r *fakeSlideRepo) ReorderSlides(ctx context.Context, presentationID string, positions map[string]int) error {
	return nil
}

const (
	ownerID    = "owner-1"
	strangerID = "stranger-1"
)

func newUC() (*UseCase, *fakePresentationRepo, *fakeSlideRepo) {
	prepo := newFakePresentationRepo()
	srepo := &fakeSlideRepo{}
	return NewUseCase(prepo, srepo), prepo, srepo
}

func TestCreate(t *testing.T) {
	ctx := context.Background()
	uc, _, srepo := newUC()

	p, err := uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "My Deck"})
	if err != nil {
		t.Fatalf("Create returned error: %v", err)
	}
	if p.ID == "" {
		t.Fatal("expected presentation to have an ID")
	}
	if p.Title != "My Deck" || string(p.OwnerID) != ownerID {
		t.Fatalf("unexpected presentation %+v", p)
	}

	// exactly one first slide auto-created for the new presentation
	if len(srepo.created) != 1 {
		t.Fatalf("expected 1 auto-created slide, got %d", len(srepo.created))
	}
	if srepo.created[0].PresentationID != p.ID {
		t.Fatalf("first slide presentation id = %q, want %q", srepo.created[0].PresentationID, p.ID)
	}
	if srepo.created[0].Position != 0 {
		t.Fatalf("first slide position = %d, want 0", srepo.created[0].Position)
	}
}

func TestGet(t *testing.T) {
	ctx := context.Background()

	t.Run("owner can get", func(t *testing.T) {
		uc, _, _ := newUC()
		created, _ := uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "T"})
		got, err := uc.Get(ctx, string(created.ID), ownerID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != created.ID {
			t.Fatalf("got id %q, want %q", got.ID, created.ID)
		}
	})

	t.Run("non-owner returns ErrForbidden", func(t *testing.T) {
		uc, _, _ := newUC()
		created, _ := uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "T"})
		_, err := uc.Get(ctx, string(created.ID), strangerID)
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
}

func TestUpdate(t *testing.T) {
	ctx := context.Background()

	t.Run("owner updates title", func(t *testing.T) {
		uc, prepo, _ := newUC()
		created, _ := uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "Old"})
		updated, err := uc.Update(ctx, string(created.ID), ownerID, "New Title")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if updated.Title != "New Title" {
			t.Fatalf("title = %q, want New Title", updated.Title)
		}
		if prepo.byID[created.ID].Title != "New Title" {
			t.Fatal("title not persisted")
		}
	})

	t.Run("non-owner returns ErrForbidden", func(t *testing.T) {
		uc, _, _ := newUC()
		created, _ := uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "Old"})
		_, err := uc.Update(ctx, string(created.ID), strangerID, "Hacked")
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
}

func TestDelete(t *testing.T) {
	ctx := context.Background()

	t.Run("owner deletes", func(t *testing.T) {
		uc, prepo, _ := newUC()
		created, _ := uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "T"})
		if err := uc.Delete(ctx, string(created.ID), ownerID); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if _, ok := prepo.byID[created.ID]; ok {
			t.Fatal("presentation not deleted")
		}
	})

	t.Run("non-owner returns ErrForbidden", func(t *testing.T) {
		uc, prepo, _ := newUC()
		created, _ := uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "T"})
		err := uc.Delete(ctx, string(created.ID), strangerID)
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
		if _, ok := prepo.byID[created.ID]; !ok {
			t.Fatal("presentation should not have been deleted by non-owner")
		}
	})
}

func TestList(t *testing.T) {
	ctx := context.Background()
	uc, _, _ := newUC()
	uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "A"})
	uc.Create(ctx, CreateInput{OwnerID: ownerID, Title: "B"})
	uc.Create(ctx, CreateInput{OwnerID: strangerID, Title: "C"})

	got, total, err := uc.List(ctx, ownerID, 10, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 2 || len(got) != 2 {
		t.Fatalf("expected 2 presentations for owner, got len=%d total=%d", len(got), total)
	}
	for _, p := range got {
		if string(p.OwnerID) != ownerID {
			t.Fatalf("List returned presentation owned by %q", p.OwnerID)
		}
	}
}

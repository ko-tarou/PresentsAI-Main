package member

import (
	"context"
	"errors"
	"testing"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

const (
	presID     = "pres-1"
	ownerID    = "owner-1"
	strangerID = "stranger-1"
)

// fakeMemberRepo is an in-memory member Repository.
type fakeMemberRepo struct {
	members map[string]Member // keyed by presentationID+":"+userID
}

func newFakeMemberRepo() *fakeMemberRepo {
	return &fakeMemberRepo{members: map[string]Member{}}
}

func key(pid, uid string) string { return pid + ":" + uid }

func (r *fakeMemberRepo) AddMember(ctx context.Context, presentationID, userID, role string) error {
	r.members[key(presentationID, userID)] = Member{
		PresentationID: presentationID,
		UserID:         userID,
		Role:           role,
	}
	return nil
}

func (r *fakeMemberRepo) ListMembers(ctx context.Context, presentationID string) ([]Member, error) {
	var out []Member
	for _, m := range r.members {
		if m.PresentationID == presentationID {
			out = append(out, m)
		}
	}
	return out, nil
}

func (r *fakeMemberRepo) GetMember(ctx context.Context, presentationID, userID string) (*Member, error) {
	if m, ok := r.members[key(presentationID, userID)]; ok {
		return &m, nil
	}
	return nil, sharedErr.ErrNotFound
}

func (r *fakeMemberRepo) UpdateRole(ctx context.Context, presentationID, userID, role string) error {
	k := key(presentationID, userID)
	m, ok := r.members[k]
	if !ok {
		return sharedErr.ErrNotFound
	}
	m.Role = role
	r.members[k] = m
	return nil
}

func (r *fakeMemberRepo) RemoveMember(ctx context.Context, presentationID, userID string) error {
	delete(r.members, key(presentationID, userID))
	return nil
}

// fakePresentationRepo returns a single presentation owned by ownerID.
type fakePresentationRepo struct {
	pres map[domainPresentation.ID]*domainPresentation.Presentation
}

func newFakePresentationRepo() *fakePresentationRepo {
	return &fakePresentationRepo{
		pres: map[domainPresentation.ID]*domainPresentation.Presentation{
			domainPresentation.ID(presID): {
				ID:      domainPresentation.ID(presID),
				OwnerID: domainUser.ID(ownerID),
				Title:   "Deck",
			},
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

// fakeUserRepo is an in-memory user Repository keyed by email.
type fakeUserRepo struct {
	byEmail map[string]*domainUser.User
}

func newFakeUserRepo() *fakeUserRepo {
	return &fakeUserRepo{byEmail: map[string]*domainUser.User{}}
}

func (r *fakeUserRepo) add(email, id, display string) {
	r.byEmail[email] = &domainUser.User{ID: domainUser.ID(id), Email: email, DisplayName: display}
}

func (r *fakeUserRepo) Create(ctx context.Context, u *domainUser.User) error { return nil }
func (r *fakeUserRepo) FindByID(ctx context.Context, id domainUser.ID) (*domainUser.User, error) {
	return nil, sharedErr.ErrNotFound
}
func (r *fakeUserRepo) FindByEmail(ctx context.Context, email string) (*domainUser.User, error) {
	if u, ok := r.byEmail[email]; ok {
		return u, nil
	}
	return nil, sharedErr.ErrNotFound
}
func (r *fakeUserRepo) Update(ctx context.Context, u *domainUser.User) error { return nil }

func setup() (*UseCase, *fakeMemberRepo, *fakeUserRepo) {
	mrepo := newFakeMemberRepo()
	urepo := newFakeUserRepo()
	uc := NewUseCase(mrepo, newFakePresentationRepo(), urepo)
	return uc, mrepo, urepo
}

func TestInviteByEmail(t *testing.T) {
	ctx := context.Background()

	t.Run("owner with valid role succeeds", func(t *testing.T) {
		for _, role := range []string{"editor", "viewer"} {
			uc, mrepo, urepo := setup()
			urepo.add("invitee@example.com", "u-2", "Invitee")

			m, err := uc.InviteByEmail(ctx, presID, ownerID, "invitee@example.com", role)
			if err != nil {
				t.Fatalf("role %q: unexpected error: %v", role, err)
			}
			if m.Email != "invitee@example.com" || m.Role != role || m.UserID != "u-2" {
				t.Fatalf("role %q: unexpected member %+v", role, m)
			}
			if _, ok := mrepo.members[key(presID, "u-2")]; !ok {
				t.Fatalf("role %q: member not persisted", role)
			}
		}
	})

	t.Run("non-owner returns ErrForbidden", func(t *testing.T) {
		uc, _, urepo := setup()
		urepo.add("invitee@example.com", "u-2", "Invitee")
		_, err := uc.InviteByEmail(ctx, presID, strangerID, "invitee@example.com", "editor")
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})

	t.Run("invalid role returns ErrInvalidInput", func(t *testing.T) {
		for _, role := range []string{"owner", "admin", ""} {
			uc, _, urepo := setup()
			urepo.add("invitee@example.com", "u-2", "Invitee")
			_, err := uc.InviteByEmail(ctx, presID, ownerID, "invitee@example.com", role)
			if !errors.Is(err, sharedErr.ErrInvalidInput) {
				t.Fatalf("role %q: err = %v, want ErrInvalidInput", role, err)
			}
		}
	})

	t.Run("email with no user returns error", func(t *testing.T) {
		uc, _, _ := setup()
		_, err := uc.InviteByEmail(ctx, presID, ownerID, "ghost@example.com", "editor")
		if err == nil {
			t.Fatal("expected error for unknown user, got nil")
		}
	})
}

func TestUpdateRole(t *testing.T) {
	ctx := context.Background()

	t.Run("owner succeeds", func(t *testing.T) {
		uc, mrepo, _ := setup()
		mrepo.AddMember(ctx, presID, "u-2", "viewer")
		if err := uc.UpdateRole(ctx, presID, ownerID, "u-2", "editor"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got := mrepo.members[key(presID, "u-2")].Role; got != "editor" {
			t.Fatalf("role = %q, want editor", got)
		}
	})

	t.Run("non-owner returns ErrForbidden", func(t *testing.T) {
		uc, _, _ := setup()
		err := uc.UpdateRole(ctx, presID, strangerID, "u-2", "editor")
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})

	t.Run("invalid role returns ErrInvalidInput", func(t *testing.T) {
		uc, _, _ := setup()
		err := uc.UpdateRole(ctx, presID, ownerID, "u-2", "owner")
		if !errors.Is(err, sharedErr.ErrInvalidInput) {
			t.Fatalf("err = %v, want ErrInvalidInput", err)
		}
	})
}

func TestRemoveMember(t *testing.T) {
	ctx := context.Background()

	t.Run("owner succeeds", func(t *testing.T) {
		uc, mrepo, _ := setup()
		mrepo.AddMember(ctx, presID, "u-2", "viewer")
		if err := uc.RemoveMember(ctx, presID, ownerID, "u-2"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if _, ok := mrepo.members[key(presID, "u-2")]; ok {
			t.Fatal("member was not removed")
		}
	})

	t.Run("non-owner returns ErrForbidden", func(t *testing.T) {
		uc, mrepo, _ := setup()
		mrepo.AddMember(ctx, presID, "u-2", "viewer")
		err := uc.RemoveMember(ctx, presID, strangerID, "u-2")
		if !errors.Is(err, sharedErr.ErrForbidden) {
			t.Fatalf("err = %v, want ErrForbidden", err)
		}
	})
}

func TestListMembers(t *testing.T) {
	ctx := context.Background()
	uc, mrepo, _ := setup()
	mrepo.AddMember(ctx, presID, "u-2", "viewer")
	mrepo.AddMember(ctx, presID, "u-3", "editor")

	// caller is the owner
	got, err := uc.ListMembers(ctx, presID, ownerID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 members, got %d", len(got))
	}
}

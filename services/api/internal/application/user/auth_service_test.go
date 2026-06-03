package user

import (
	"context"
	"errors"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

// fakeUserRepo is an in-memory implementation of domainUser.Repository.
type fakeUserRepo struct {
	mu     sync.Mutex
	byID   map[domainUser.ID]*domainUser.User
	nextID int
}

func newFakeUserRepo() *fakeUserRepo {
	return &fakeUserRepo{byID: map[domainUser.ID]*domainUser.User{}}
}

func (r *fakeUserRepo) Create(ctx context.Context, u *domainUser.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.nextID++
	u.ID = domainUser.ID("user-" + strconv.Itoa(r.nextID))
	// store a copy to avoid aliasing surprises
	cp := *u
	r.byID[u.ID] = &cp
	return nil
}

func (r *fakeUserRepo) FindByID(ctx context.Context, id domainUser.ID) (*domainUser.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if u, ok := r.byID[id]; ok {
		cp := *u
		return &cp, nil
	}
	return nil, sharedErr.ErrNotFound
}

func (r *fakeUserRepo) FindByEmail(ctx context.Context, email string) (*domainUser.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, u := range r.byID {
		if u.Email == email {
			cp := *u
			return &cp, nil
		}
	}
	return nil, sharedErr.ErrNotFound
}

func (r *fakeUserRepo) Update(ctx context.Context, u *domainUser.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.byID[u.ID]; !ok {
		return sharedErr.ErrNotFound
	}
	cp := *u
	r.byID[u.ID] = &cp
	return nil
}

// storedUser returns the stored user with the given email (for white-box assertions).
func (r *fakeUserRepo) storedUser(email string) *domainUser.User {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, u := range r.byID {
		if u.Email == email {
			return u
		}
	}
	return nil
}

// fakeRefreshRepo is an in-memory RefreshTokenRepository.
type fakeRefreshRepo struct {
	mu     sync.Mutex
	tokens map[string]refreshEntry // keyed by tokenHash
}

type refreshEntry struct {
	userID    string
	expiresAt time.Time
}

func newFakeRefreshRepo() *fakeRefreshRepo {
	return &fakeRefreshRepo{tokens: map[string]refreshEntry{}}
}

func (r *fakeRefreshRepo) Store(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.tokens[tokenHash] = refreshEntry{userID: userID, expiresAt: expiresAt}
	return nil
}

func (r *fakeRefreshRepo) Find(ctx context.Context, tokenHash string) (string, time.Time, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if e, ok := r.tokens[tokenHash]; ok {
		return e.userID, e.expiresAt, nil
	}
	return "", time.Time{}, sharedErr.ErrNotFound
}

func (r *fakeRefreshRepo) Delete(ctx context.Context, tokenHash string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.tokens, tokenHash)
	return nil
}

func (r *fakeRefreshRepo) DeleteAllForUser(ctx context.Context, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for hash, e := range r.tokens {
		if e.userID == userID {
			delete(r.tokens, hash)
		}
	}
	return nil
}

func (r *fakeRefreshRepo) count() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.tokens)
}

// has reports whether a token with the given hash is stored.
func (r *fakeRefreshRepo) has(tokenHash string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	_, ok := r.tokens[tokenHash]
	return ok
}

// setExpiry forcibly overrides the stored expiry for a token hash (test helper).
func (r *fakeRefreshRepo) setExpiry(tokenHash string, t time.Time) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if e, ok := r.tokens[tokenHash]; ok {
		e.expiresAt = t
		r.tokens[tokenHash] = e
	}
}

// setSecrets sets the JWT env vars and must be called before NewAuthService,
// because NewAuthService reads the secrets from the environment at construction.
func setSecrets(t *testing.T) {
	t.Helper()
	t.Setenv("JWT_SECRET", "test-access-secret")
	t.Setenv("JWT_REFRESH_SECRET", "test-refresh-secret")
}

// subFromToken parses a HS256 JWT signed with secret and returns its "sub" claim.
func subFromToken(t *testing.T, token, secret string) string {
	t.Helper()
	parsed, err := jwt.Parse(token, func(*jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		t.Fatalf("parse token: %v", err)
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatalf("unexpected claims type %T", parsed.Claims)
	}
	sub, _ := claims["sub"].(string)
	return sub
}

func TestRegister(t *testing.T) {
	ctx := context.Background()

	t.Run("new email returns token pair with valid claims", func(t *testing.T) {
		setSecrets(t)
		users := newFakeUserRepo()
		refresh := newFakeRefreshRepo()
		svc := NewAuthService(users, refresh)

		pair, err := svc.Register(ctx, "alice@example.com", "s3cret-pass", "Alice")
		if err != nil {
			t.Fatalf("Register returned error: %v", err)
		}
		if pair.AccessToken == "" || pair.RefreshToken == "" {
			t.Fatalf("expected non-empty tokens, got access=%q refresh=%q", pair.AccessToken, pair.RefreshToken)
		}

		stored := users.storedUser("alice@example.com")
		if stored == nil {
			t.Fatal("user was not stored")
		}
		// access token sub must decode to the created user's id
		sub := subFromToken(t, pair.AccessToken, "test-access-secret")
		if sub != string(stored.ID) {
			t.Fatalf("sub claim = %q, want %q", sub, string(stored.ID))
		}
		// password must be bcrypt-hashed, not plaintext
		if stored.PasswordHash == "s3cret-pass" {
			t.Fatal("password stored in plaintext")
		}
		if err := bcrypt.CompareHashAndPassword([]byte(stored.PasswordHash), []byte("s3cret-pass")); err != nil {
			t.Fatalf("stored hash does not verify against plaintext: %v", err)
		}
		// a refresh token must have been persisted
		if refresh.count() != 1 {
			t.Fatalf("expected 1 stored refresh token, got %d", refresh.count())
		}
	})

	t.Run("existing email returns ErrAlreadyExists", func(t *testing.T) {
		setSecrets(t)
		users := newFakeUserRepo()
		svc := NewAuthService(users, newFakeRefreshRepo())

		if _, err := svc.Register(ctx, "dup@example.com", "pw1", "First"); err != nil {
			t.Fatalf("first register failed: %v", err)
		}
		_, err := svc.Register(ctx, "dup@example.com", "pw2", "Second")
		if !errors.Is(err, sharedErr.ErrAlreadyExists) {
			t.Fatalf("err = %v, want ErrAlreadyExists", err)
		}
	})
}

func TestLogin(t *testing.T) {
	ctx := context.Background()

	register := func(t *testing.T) (*AuthService, *fakeUserRepo) {
		setSecrets(t)
		users := newFakeUserRepo()
		svc := NewAuthService(users, newFakeRefreshRepo())
		if _, err := svc.Register(ctx, "bob@example.com", "correct-horse", "Bob"); err != nil {
			t.Fatalf("setup register failed: %v", err)
		}
		return svc, users
	}

	t.Run("correct password returns token pair", func(t *testing.T) {
		svc, users := register(t)
		pair, err := svc.Login(ctx, "bob@example.com", "correct-horse")
		if err != nil {
			t.Fatalf("Login returned error: %v", err)
		}
		if pair.AccessToken == "" || pair.RefreshToken == "" {
			t.Fatal("expected non-empty tokens")
		}
		sub := subFromToken(t, pair.AccessToken, "test-access-secret")
		if sub != string(users.storedUser("bob@example.com").ID) {
			t.Fatal("sub claim does not match user id")
		}
	})

	t.Run("wrong password returns ErrUnauthorized", func(t *testing.T) {
		svc, _ := register(t)
		_, err := svc.Login(ctx, "bob@example.com", "wrong")
		if !errors.Is(err, sharedErr.ErrUnauthorized) {
			t.Fatalf("err = %v, want ErrUnauthorized", err)
		}
	})

	t.Run("unknown email returns ErrUnauthorized", func(t *testing.T) {
		svc, _ := register(t)
		_, err := svc.Login(ctx, "nobody@example.com", "whatever")
		if !errors.Is(err, sharedErr.ErrUnauthorized) {
			t.Fatalf("err = %v, want ErrUnauthorized", err)
		}
	})
}

func TestRefresh(t *testing.T) {
	ctx := context.Background()

	t.Run("valid token rotates and returns new pair", func(t *testing.T) {
		setSecrets(t)
		refresh := newFakeRefreshRepo()
		svc := NewAuthService(newFakeUserRepo(), refresh)

		pair, err := svc.Register(ctx, "carol@example.com", "pw", "Carol")
		if err != nil {
			t.Fatalf("register failed: %v", err)
		}
		oldHash := hashToken(pair.RefreshToken)
		if !refresh.has(oldHash) {
			t.Fatal("refresh token not stored after register")
		}

		newPair, err := svc.Refresh(ctx, pair.RefreshToken)
		if err != nil {
			t.Fatalf("Refresh returned error: %v", err)
		}
		if newPair.AccessToken == "" || newPair.RefreshToken == "" {
			t.Fatal("expected non-empty rotated tokens")
		}
		// old token must be rotated out
		if refresh.has(oldHash) {
			t.Fatal("old refresh token was not deleted (rotation failed)")
		}
		// new token must be stored
		if !refresh.has(hashToken(newPair.RefreshToken)) {
			t.Fatal("new refresh token not stored")
		}
		if refresh.count() != 1 {
			t.Fatalf("expected exactly 1 stored token after rotation, got %d", refresh.count())
		}
	})

	t.Run("unknown token returns ErrUnauthorized", func(t *testing.T) {
		setSecrets(t)
		svc := NewAuthService(newFakeUserRepo(), newFakeRefreshRepo())
		_, err := svc.Refresh(ctx, "not-a-real-token")
		if !errors.Is(err, sharedErr.ErrUnauthorized) {
			t.Fatalf("err = %v, want ErrUnauthorized", err)
		}
	})

	t.Run("expired token returns ErrUnauthorized", func(t *testing.T) {
		setSecrets(t)
		refresh := newFakeRefreshRepo()
		svc := NewAuthService(newFakeUserRepo(), refresh)
		pair, err := svc.Register(ctx, "dan@example.com", "pw", "Dan")
		if err != nil {
			t.Fatalf("register failed: %v", err)
		}
		refresh.setExpiry(hashToken(pair.RefreshToken), time.Now().Add(-time.Hour))
		_, err = svc.Refresh(ctx, pair.RefreshToken)
		if !errors.Is(err, sharedErr.ErrUnauthorized) {
			t.Fatalf("err = %v, want ErrUnauthorized", err)
		}
	})
}

func TestLogout(t *testing.T) {
	ctx := context.Background()
	setSecrets(t)
	refresh := newFakeRefreshRepo()
	svc := NewAuthService(newFakeUserRepo(), refresh)

	pair, err := svc.Register(ctx, "erin@example.com", "pw", "Erin")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}
	userID, _, err := refresh.Find(ctx, hashToken(pair.RefreshToken))
	if err != nil {
		t.Fatalf("could not look up stored token: %v", err)
	}
	// issue a second token for the same user to ensure all are removed
	if _, err := svc.issueTokenPair(ctx, userID); err != nil {
		t.Fatalf("issueTokenPair failed: %v", err)
	}
	if refresh.count() != 2 {
		t.Fatalf("expected 2 stored tokens before logout, got %d", refresh.count())
	}

	if err := svc.Logout(ctx, userID); err != nil {
		t.Fatalf("Logout returned error: %v", err)
	}
	if refresh.count() != 0 {
		t.Fatalf("expected 0 stored tokens after logout, got %d", refresh.count())
	}
}

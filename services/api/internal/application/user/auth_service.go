package user

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

const (
	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 7 * 24 * time.Hour
)

type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
}

type RefreshTokenRepository interface {
	Store(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error
	Find(ctx context.Context, tokenHash string) (userID string, expiresAt time.Time, err error)
	Delete(ctx context.Context, tokenHash string) error
	DeleteAllForUser(ctx context.Context, userID string) error
}

type AuthService struct {
	userRepo    domainUser.Repository
	refreshRepo RefreshTokenRepository
	jwtSecret   string
	refreshSec  string
}

func NewAuthService(
	userRepo domainUser.Repository,
	refreshRepo RefreshTokenRepository,
) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		refreshRepo: refreshRepo,
		jwtSecret:   os.Getenv("JWT_SECRET"),
		refreshSec:  os.Getenv("JWT_REFRESH_SECRET"),
	}
}

func (s *AuthService) Register(ctx context.Context, email, password, displayName string) (*TokenPair, error) {
	if _, err := s.userRepo.FindByEmail(ctx, email); err == nil {
		return nil, sharedErr.ErrAlreadyExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := domainUser.New(email, string(hash), displayName)
	if err := s.userRepo.Create(ctx, u); err != nil {
		return nil, err
	}

	return s.issueTokenPair(ctx, string(u.ID))
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*TokenPair, error) {
	u, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, sharedErr.ErrUnauthorized
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, sharedErr.ErrUnauthorized
	}

	return s.issueTokenPair(ctx, string(u.ID))
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*TokenPair, error) {
	hash := hashToken(refreshToken)
	userID, expiresAt, err := s.refreshRepo.Find(ctx, hash)
	if err != nil || time.Now().After(expiresAt) {
		return nil, sharedErr.ErrUnauthorized
	}

	if err := s.refreshRepo.Delete(ctx, hash); err != nil {
		return nil, err
	}

	return s.issueTokenPair(ctx, userID)
}

func (s *AuthService) Logout(ctx context.Context, userID string) error {
	return s.refreshRepo.DeleteAllForUser(ctx, userID)
}

func (s *AuthService) issueTokenPair(ctx context.Context, userID string) (*TokenPair, error) {
	now := time.Now()

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"iat": now.Unix(),
		"exp": now.Add(accessTokenTTL).Unix(),
	}).SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, err
	}

	jti, err := randomJTI()
	if err != nil {
		return nil, err
	}
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"iat": now.Unix(),
		"exp": now.Add(refreshTokenTTL).Unix(),
		"jti": jti,
	}).SignedString([]byte(s.refreshSec))
	if err != nil {
		return nil, err
	}

	expiresAt := now.Add(refreshTokenTTL)
	if err := s.refreshRepo.Store(ctx, userID, hashToken(refreshToken), expiresAt); err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(accessTokenTTL.Seconds()),
	}, nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

// randomJTI returns a random token identifier so that two refresh tokens
// issued for the same user within the same second are never identical
// (which would otherwise collide on their hash and break rotation).
func randomJTI() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

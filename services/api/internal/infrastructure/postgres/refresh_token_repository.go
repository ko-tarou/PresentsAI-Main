package postgres

import (
	"context"
	"time"

	"gorm.io/gorm"

	appUser "github.com/ko-tarou/presentsai/services/api/internal/application/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) appUser.RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Store(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	m := &RefreshTokenModel{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *refreshTokenRepository) Find(ctx context.Context, tokenHash string) (string, time.Time, error) {
	var m RefreshTokenModel
	if err := r.db.WithContext(ctx).First(&m, "token_hash = ?", tokenHash).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", time.Time{}, sharedErr.ErrNotFound
		}
		return "", time.Time{}, err
	}
	return m.UserID, m.ExpiresAt, nil
}

func (r *refreshTokenRepository) Delete(ctx context.Context, tokenHash string) error {
	return r.db.WithContext(ctx).Delete(&RefreshTokenModel{}, "token_hash = ?", tokenHash).Error
}

func (r *refreshTokenRepository) DeleteAllForUser(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).Delete(&RefreshTokenModel{}, "user_id = ?", userID).Error
}

package postgres

import (
	"context"

	"gorm.io/gorm"

	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domainUser.Repository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, u *domainUser.User) error {
	m := &UserModel{
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		DisplayName:  u.DisplayName,
		AvatarURL:    u.AvatarURL,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	u.ID = domainUser.ID(m.ID)
	u.CreatedAt = m.CreatedAt
	u.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *userRepository) FindByID(ctx context.Context, id domainUser.ID) (*domainUser.User, error) {
	var m UserModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", string(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, sharedErr.ErrNotFound
		}
		return nil, err
	}
	return modelToUser(&m), nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domainUser.User, error) {
	var m UserModel
	if err := r.db.WithContext(ctx).First(&m, "email = ?", email).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, sharedErr.ErrNotFound
		}
		return nil, err
	}
	return modelToUser(&m), nil
}

func (r *userRepository) Update(ctx context.Context, u *domainUser.User) error {
	return r.db.WithContext(ctx).
		Model(&UserModel{}).
		Where("id = ?", string(u.ID)).
		Updates(map[string]interface{}{
			"display_name": u.DisplayName,
			"avatar_url":   u.AvatarURL,
		}).Error
}

func modelToUser(m *UserModel) *domainUser.User {
	return &domainUser.User{
		ID:           domainUser.ID(m.ID),
		Email:        m.Email,
		PasswordHash: m.PasswordHash,
		DisplayName:  m.DisplayName,
		AvatarURL:    m.AvatarURL,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}

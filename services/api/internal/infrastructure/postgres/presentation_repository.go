package postgres

import (
	"context"

	"gorm.io/gorm"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type presentationRepository struct {
	db *gorm.DB
}

func NewPresentationRepository(db *gorm.DB) domainPresentation.Repository {
	return &presentationRepository{db: db}
}

func (r *presentationRepository) Create(ctx context.Context, p *domainPresentation.Presentation) error {
	m := &PresentationModel{
		OwnerID:      string(p.OwnerID),
		Title:        p.Title,
		ThumbnailURL: p.ThumbnailURL,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	p.ID = domainPresentation.ID(m.ID)
	p.CreatedAt = m.CreatedAt
	p.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *presentationRepository) FindByID(ctx context.Context, id domainPresentation.ID) (*domainPresentation.Presentation, error) {
	var m PresentationModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", string(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, sharedErr.ErrNotFound
		}
		return nil, err
	}
	return modelToPresentation(&m), nil
}

func (r *presentationRepository) FindByOwner(ctx context.Context, ownerID string, limit, offset int) ([]*domainPresentation.Presentation, int64, error) {
	var models []PresentationModel
	var total int64

	r.db.WithContext(ctx).Model(&PresentationModel{}).Where("owner_id = ?", ownerID).Count(&total)
	if err := r.db.WithContext(ctx).
		Where("owner_id = ?", ownerID).
		Order("updated_at DESC").
		Limit(limit).Offset(offset).
		Find(&models).Error; err != nil {
		return nil, 0, err
	}

	result := make([]*domainPresentation.Presentation, len(models))
	for i, m := range models {
		m := m
		result[i] = modelToPresentation(&m)
	}
	return result, total, nil
}

func (r *presentationRepository) Update(ctx context.Context, p *domainPresentation.Presentation) error {
	return r.db.WithContext(ctx).
		Model(&PresentationModel{}).
		Where("id = ?", string(p.ID)).
		Updates(map[string]interface{}{
			"title":         p.Title,
			"thumbnail_url": p.ThumbnailURL,
		}).Error
}

func (r *presentationRepository) Delete(ctx context.Context, id domainPresentation.ID) error {
	return r.db.WithContext(ctx).Delete(&PresentationModel{}, "id = ?", string(id)).Error
}

func modelToPresentation(m *PresentationModel) *domainPresentation.Presentation {
	return &domainPresentation.Presentation{
		ID:           domainPresentation.ID(m.ID),
		OwnerID:      domainUser.ID(m.OwnerID),
		Title:        m.Title,
		ThumbnailURL: m.ThumbnailURL,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}

package postgres

import (
	"context"

	"gorm.io/gorm"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainSlide "github.com/ko-tarou/presentsai/services/api/internal/domain/slide"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type slideRepository struct {
	db *gorm.DB
}

func NewSlideRepository(db *gorm.DB) domainSlide.Repository {
	return &slideRepository{db: db}
}

func (r *slideRepository) Create(ctx context.Context, s *domainSlide.Slide) error {
	m := &SlideModel{
		PresentationID: string(s.PresentationID),
		Position:       s.Position,
		ThumbnailURL:   s.ThumbnailURL,
		Content:        JSONB(s.Content),
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	s.ID = domainSlide.ID(m.ID)
	s.CreatedAt = m.CreatedAt
	s.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *slideRepository) FindByID(ctx context.Context, id domainSlide.ID) (*domainSlide.Slide, error) {
	var m SlideModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", string(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, sharedErr.ErrNotFound
		}
		return nil, err
	}
	return modelToSlide(&m), nil
}

func (r *slideRepository) FindByPresentation(ctx context.Context, presentationID string) ([]*domainSlide.Slide, error) {
	var models []SlideModel
	if err := r.db.WithContext(ctx).
		Where("presentation_id = ?", presentationID).
		Order("position ASC").
		Find(&models).Error; err != nil {
		return nil, err
	}

	result := make([]*domainSlide.Slide, len(models))
	for i, m := range models {
		m := m
		result[i] = modelToSlide(&m)
	}
	return result, nil
}

func (r *slideRepository) Update(ctx context.Context, s *domainSlide.Slide) error {
	return r.db.WithContext(ctx).
		Model(&SlideModel{}).
		Where("id = ?", string(s.ID)).
		Updates(map[string]interface{}{
			"content":       JSONB(s.Content),
			"thumbnail_url": s.ThumbnailURL,
		}).Error
}

func (r *slideRepository) Delete(ctx context.Context, id domainSlide.ID) error {
	return r.db.WithContext(ctx).Delete(&SlideModel{}, "id = ?", string(id)).Error
}

func (r *slideRepository) ReorderSlides(ctx context.Context, presentationID string, positions map[string]int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for id, pos := range positions {
			if err := tx.Model(&SlideModel{}).
				Where("id = ? AND presentation_id = ?", id, presentationID).
				Update("position", pos).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func modelToSlide(m *SlideModel) *domainSlide.Slide {
	return &domainSlide.Slide{
		ID:             domainSlide.ID(m.ID),
		PresentationID: domainPresentation.ID(m.PresentationID),
		Position:       m.Position,
		ThumbnailURL:   m.ThumbnailURL,
		Content:        domainSlide.Content(m.Content),
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

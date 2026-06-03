package postgres

import (
	"context"

	"gorm.io/gorm"

	appMember "github.com/ko-tarou/presentsai/services/api/internal/application/member"
)

type memberRepository struct{ db *gorm.DB }

func NewMemberRepository(db *gorm.DB) appMember.Repository {
	return &memberRepository{db: db}
}

func (r *memberRepository) AddMember(ctx context.Context, presentationID, userID, role string) error {
	m := &PresentationMemberModel{
		PresentationID: presentationID,
		UserID:         userID,
		Role:           role,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *memberRepository) ListMembers(ctx context.Context, presentationID string) ([]appMember.Member, error) {
	type row struct {
		PresentationMemberModel
		Email       string
		DisplayName string
	}
	var rows []row
	err := r.db.WithContext(ctx).
		Table("presentation_members pm").
		Select("pm.*, u.email, u.display_name").
		Joins("JOIN users u ON u.id = pm.user_id").
		Where("pm.presentation_id = ?", presentationID).
		Order("pm.created_at ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make([]appMember.Member, len(rows))
	for i, r := range rows {
		result[i] = appMember.Member{
			ID:             r.PresentationMemberModel.ID,
			PresentationID: r.PresentationMemberModel.PresentationID,
			UserID:         r.PresentationMemberModel.UserID,
			Email:          r.Email,
			DisplayName:    r.DisplayName,
			Role:           r.PresentationMemberModel.Role,
			CreatedAt:      r.PresentationMemberModel.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}
	return result, nil
}

func (r *memberRepository) GetMember(ctx context.Context, presentationID, userID string) (*appMember.Member, error) {
	var m PresentationMemberModel
	err := r.db.WithContext(ctx).
		Where("presentation_id = ? AND user_id = ?", presentationID, userID).
		First(&m).Error
	if err != nil {
		return nil, err
	}
	return &appMember.Member{
		ID:             m.ID,
		PresentationID: m.PresentationID,
		UserID:         m.UserID,
		Role:           m.Role,
	}, nil
}

func (r *memberRepository) UpdateRole(ctx context.Context, presentationID, userID, role string) error {
	return r.db.WithContext(ctx).
		Model(&PresentationMemberModel{}).
		Where("presentation_id = ? AND user_id = ?", presentationID, userID).
		Update("role", role).Error
}

func (r *memberRepository) RemoveMember(ctx context.Context, presentationID, userID string) error {
	return r.db.WithContext(ctx).
		Where("presentation_id = ? AND user_id = ?", presentationID, userID).
		Delete(&PresentationMemberModel{}).Error
}

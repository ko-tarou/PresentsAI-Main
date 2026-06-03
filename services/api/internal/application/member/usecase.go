package member

import (
	"context"
	"errors"

	domainPresentation "github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
	domainUser "github.com/ko-tarou/presentsai/services/api/internal/domain/user"
	sharedErr "github.com/ko-tarou/presentsai/services/api/internal/shared/errors"
)

type Member struct {
	ID             string `json:"id"`
	PresentationID string `json:"presentationId"`
	UserID         string `json:"userId"`
	Email          string `json:"email"`
	DisplayName    string `json:"displayName"`
	Role           string `json:"role"`
	CreatedAt      string `json:"createdAt"`
}

type Repository interface {
	AddMember(ctx context.Context, presentationID, userID, role string) error
	ListMembers(ctx context.Context, presentationID string) ([]Member, error)
	GetMember(ctx context.Context, presentationID, userID string) (*Member, error)
	UpdateRole(ctx context.Context, presentationID, userID, role string) error
	RemoveMember(ctx context.Context, presentationID, userID string) error
}

type UseCase struct {
	repo             Repository
	presentationRepo domainPresentation.Repository
	userRepo         domainUser.Repository
}

func NewUseCase(repo Repository, presentationRepo domainPresentation.Repository, userRepo domainUser.Repository) *UseCase {
	return &UseCase{repo: repo, presentationRepo: presentationRepo, userRepo: userRepo}
}

func (uc *UseCase) isOwner(ctx context.Context, presentationID, callerID string) error {
	p, err := uc.presentationRepo.FindByID(ctx, domainPresentation.ID(presentationID))
	if err != nil {
		return err
	}
	if string(p.OwnerID) != callerID {
		return sharedErr.ErrForbidden
	}
	return nil
}

func (uc *UseCase) ListMembers(ctx context.Context, presentationID, callerID string) ([]Member, error) {
	// allow any member to list
	m, err := uc.repo.GetMember(ctx, presentationID, callerID)
	if err != nil {
		// also allow if owner
		if ownerErr := uc.isOwner(ctx, presentationID, callerID); ownerErr != nil {
			return nil, sharedErr.ErrForbidden
		}
	}
	_ = m
	return uc.repo.ListMembers(ctx, presentationID)
}

func (uc *UseCase) InviteByEmail(ctx context.Context, presentationID, callerID, email, role string) (*Member, error) {
	if err := uc.isOwner(ctx, presentationID, callerID); err != nil {
		return nil, err
	}
	if role != "editor" && role != "viewer" {
		return nil, sharedErr.ErrInvalidInput
	}
	target, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("user not found")
	}
	if err := uc.repo.AddMember(ctx, presentationID, string(target.ID), role); err != nil {
		return nil, err
	}
	return &Member{
		PresentationID: presentationID,
		UserID:         string(target.ID),
		Email:          target.Email,
		DisplayName:    target.DisplayName,
		Role:           role,
	}, nil
}

func (uc *UseCase) UpdateRole(ctx context.Context, presentationID, callerID, targetUserID, role string) error {
	if err := uc.isOwner(ctx, presentationID, callerID); err != nil {
		return err
	}
	if role != "editor" && role != "viewer" {
		return sharedErr.ErrInvalidInput
	}
	return uc.repo.UpdateRole(ctx, presentationID, targetUserID, role)
}

func (uc *UseCase) RemoveMember(ctx context.Context, presentationID, callerID, targetUserID string) error {
	if err := uc.isOwner(ctx, presentationID, callerID); err != nil {
		return err
	}
	return uc.repo.RemoveMember(ctx, presentationID, targetUserID)
}

package presentation

import (
	"time"

	"github.com/ko-tarou/presentsai/services/api/internal/domain/user"
)

type ID string

type Presentation struct {
	ID           ID
	OwnerID      user.ID
	Title        string
	ThumbnailURL string
	SlideCount   int
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func New(ownerID user.ID, title string) *Presentation {
	return &Presentation{
		OwnerID: ownerID,
		Title:   title,
	}
}

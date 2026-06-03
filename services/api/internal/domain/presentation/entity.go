package presentation

import (
	"time"

	"github.com/ko-tarou/presentsai/services/api/internal/domain/user"
)

type ID string

type Presentation struct {
	ID           ID        `json:"id"`
	OwnerID      user.ID   `json:"ownerId"`
	Title        string    `json:"title"`
	ThumbnailURL string    `json:"thumbnailUrl"`
	SlideCount   int       `json:"slideCount"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func New(ownerID user.ID, title string) *Presentation {
	return &Presentation{
		OwnerID: ownerID,
		Title:   title,
	}
}

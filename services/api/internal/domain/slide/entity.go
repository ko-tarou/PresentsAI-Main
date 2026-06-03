package slide

import (
	"encoding/json"
	"time"

	"github.com/ko-tarou/presentsai/services/api/internal/domain/presentation"
)

type ID string

// Content is the Fabric.js canvas JSON stored as JSONB in PostgreSQL.
type Content map[string]interface{}

type Slide struct {
	ID             ID              `json:"id"`
	PresentationID presentation.ID `json:"presentationId"`
	Position       int             `json:"position"`
	ThumbnailURL   string          `json:"thumbnailUrl"`
	Notes          string          `json:"notes"`
	Content        Content         `json:"content"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}

func New(presentationID presentation.ID, position int) *Slide {
	return &Slide{
		PresentationID: presentationID,
		Position:       position,
		Content:        Content{"version": "6.0.0", "objects": []interface{}{}},
	}
}

func (c Content) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}(c))
}

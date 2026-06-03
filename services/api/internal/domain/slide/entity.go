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
	ID             ID
	PresentationID presentation.ID
	Position       int
	ThumbnailURL   string
	Content        Content
	CreatedAt      time.Time
	UpdatedAt      time.Time
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

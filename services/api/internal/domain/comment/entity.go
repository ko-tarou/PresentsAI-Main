package comment

import "time"

type ID string

type Comment struct {
	ID             ID
	PresentationID string
	SlideID        string
	AuthorID       string
	AuthorName     string
	Body           string
	CreatedAt      time.Time
}

package postgres

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// JSONB is a PostgreSQL jsonb-compatible type.
type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("JSONB: expected []byte, got %T", value)
	}
	return json.Unmarshal(b, j)
}

type UserModel struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	DisplayName  string    `gorm:"not null;default:''"`
	AvatarURL    string    `gorm:"default:''"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}

func (UserModel) TableName() string { return "users" }

type PresentationModel struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OwnerID      string    `gorm:"type:uuid;not null;index"`
	Title        string    `gorm:"not null;default:'Untitled'"`
	ThumbnailURL string    `gorm:"default:''"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}

func (PresentationModel) TableName() string { return "presentations" }

type SlideModel struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PresentationID string    `gorm:"type:uuid;not null;index"`
	Position       int       `gorm:"not null;default:0"`
	ThumbnailURL   string    `gorm:"default:''"`
	Notes          string    `gorm:"not null;default:''"`
	Content        JSONB     `gorm:"type:jsonb;not null;default:'{}'"`
	CreatedAt      time.Time `gorm:"autoCreateTime"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime"`
}

func (SlideModel) TableName() string { return "slides" }

type RefreshTokenModel struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string    `gorm:"type:uuid;not null;index"`
	TokenHash string    `gorm:"not null;uniqueIndex"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (RefreshTokenModel) TableName() string { return "refresh_tokens" }

type PresentationMemberModel struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PresentationID string    `gorm:"type:uuid;not null;index:idx_pm_presentation_user,unique"`
	UserID         string    `gorm:"type:uuid;not null;index:idx_pm_presentation_user,unique"`
	Role           string    `gorm:"not null;default:'viewer'"` // owner, editor, viewer
	CreatedAt      time.Time `gorm:"autoCreateTime"`
}

func (PresentationMemberModel) TableName() string { return "presentation_members" }

type AssetModel struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OwnerID   string    `gorm:"type:uuid;not null;index"`
	Filename  string    `gorm:"not null"`
	MimeType  string    `gorm:"not null"`
	SizeBytes int64     `gorm:"not null"`
	StorePath string    `gorm:"not null"`
	URL       string    `gorm:"not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (AssetModel) TableName() string { return "assets" }

type CommentModel struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PresentationID string    `gorm:"type:uuid;not null;index"`
	SlideID        string    `gorm:"type:uuid;index"`
	AuthorID       string    `gorm:"type:uuid;not null"`
	AuthorName     string    `gorm:"not null;default:''"`
	Body           string    `gorm:"not null"`
	CreatedAt      time.Time `gorm:"autoCreateTime"`
}

func (CommentModel) TableName() string { return "comments" }

type SlideVersionModel struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SlideID   string    `gorm:"type:uuid;not null;index"`
	Version   int       `gorm:"not null"`
	Content   JSONB     `gorm:"type:jsonb;not null"`
	AuthorID  string    `gorm:"type:uuid"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (SlideVersionModel) TableName() string { return "slide_versions" }

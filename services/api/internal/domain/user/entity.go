package user

import (
	"time"
)

type ID string

type User struct {
	ID           ID
	Email        string
	PasswordHash string
	DisplayName  string
	AvatarURL    string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func New(email, passwordHash, displayName string) *User {
	return &User{
		Email:        email,
		PasswordHash: passwordHash,
		DisplayName:  displayName,
	}
}

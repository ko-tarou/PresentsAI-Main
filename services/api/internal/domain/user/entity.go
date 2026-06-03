package user

import "time"

type ID string

type User struct {
	ID           ID        `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	DisplayName  string    `json:"displayName"`
	AvatarURL    string    `json:"avatarUrl"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func New(email, passwordHash, displayName string) *User {
	return &User{
		Email:        email,
		PasswordHash: passwordHash,
		DisplayName:  displayName,
	}
}

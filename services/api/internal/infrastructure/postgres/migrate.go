package postgres

import (
	"log"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return err
	}

	err := db.AutoMigrate(
		&UserModel{},
		&PresentationModel{},
		&SlideModel{},
		&RefreshTokenModel{},
		&PresentationMemberModel{},
		&AssetModel{},
		&CommentModel{},
		&SlideVersionModel{},
	)
	if err != nil {
		return err
	}

	log.Println("Migrations complete")
	return nil
}

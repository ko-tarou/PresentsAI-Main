package main

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {	
	ID   uint  `gorm:"primaryKey"`
	Name string `gorm:"size:100;unique;not null"`
	Email string `gorm:"size:100;unique;not null"`
	Password string `gorm:"size:100;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	
	Projects []Project `gorm:"many2many:user_to_project;"`
	Mails []Mail `gorm:"foreignKey:UserID"`
}

type Project struct {
	ID uint `gorm:"primaryKey"`
	Title string `gorm:"size:100;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`

	Users []User `gorm:"many2many:user_to_project;"`
}

type Mail struct {
	UserID uint

	Email string `gorm:"size:255;not null"`
	ID uint `gorm:"primaryKey"`
	ProjectID uint `gorm:"not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func main() {
	dsn := "host=localhost user=postgres password=pokota dbname=PresentsAI port=5432 sslmode=disable TimeZone=Asia/Tokyo"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Dropping existing tables...")
	db.Migrator().DropTable("user_to_project")
	db.Migrator().DropTable(&User{},&Project{},&Mail{})
	fmt.Println("Recreating tables...")
	
	err = db.AutoMigrate(&User{},&Project{},&Mail{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	//試しに作成
	user := User{Name: "ko",Email:"ko@gmail.com",Password:"kotapass"}
	project := Project{Title:"presentAI"}
	
	db.Create(&user)
	db.Create(&project)

	mail := Mail{Email:user.Email,ProjectID:project.ID,UserID:user.ID}
	db.Create(&mail)

	db.Model(&user).Association("Projects").Append(&project)

	var retriecedUser User
	db.Preload("Projects").Preload("Mails").First(&retriecedUser,user.ID)
	fmt.Println("User created",user)
	fmt.Println("Mail created",mail)
}
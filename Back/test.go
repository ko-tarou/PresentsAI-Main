package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"size:100;unique;not null"`
	Email     string    `gorm:"size:100;unique;not null"`
	Password  string    `gorm:"size:100;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

var db *gorm.DB

func initDB() {
	dsn := "host=localhost user=postgres password=pokota dbname=PresentsAI port=5432 sslmode=disable TimeZone=Asia/Tokyo"
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	db.AutoMigrate(&User{})
	fmt.Println("Database connected and User table migrated")
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var user User

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := db.Create(&user).Error; err != nil {
		http.Error(w, "Faild to create user", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func main() {

	initDB()

	router := mux.NewRouter()
	router.HandleFunc("/users", createUser).Methods("POST")

	fmt.Println("Server is running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
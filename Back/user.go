package main

import (
	"encoding/json"
	"net/http"
	"time"
	"fmt"

	"github.com/gorilla/mux"
)

type User struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"size:100;unique;not null"`
	Email     string    `gorm:"size:100;unique;not null"`
	Password  string    `gorm:"size:100;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`

	UserToProjects []UserToProject  `gorm:"constraint:OnDelete:CASCADE;"`
}

type UserToProject struct {
	ID        uint `gorm:"primaryKey"`
	UserID    uint `gorm:"not null;constraint:OnDelete:CASCADE;foreignKey:UserID;references:ID;index"`	
	ProjectID uint
}


//route設定
func RegisterUserRoutes(router *mux.Router) {
	router.HandleFunc("/users", createUser).Methods("POST")
	router.HandleFunc("/users", getUsers).Methods("GET")
	router.HandleFunc("/users/{id}", deleteUser).Methods("DELETE")
}

//API設定
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

func getUsers(w http.ResponseWriter, r *http.Request) {
	var users []User
	if err := db.Find(&users).Error; err != nil {
		http.Error(w, "Faild to get users", http.StatusInternalServerError)
		return
	}
	fmt.Printf("Fetched users: %+v\n", users)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	if err := db.Delete(&User{}, id).Error; err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "User with ID %s deleted", id)
}
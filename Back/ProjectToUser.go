package main

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

type UserToProject struct {
	UserID    uint `gorm:"not null;primaryKey;index"`
	ProjectID uint `gorm:"not null;primaryKey;index"`
}


//route設定
func RegisterUserToProjectRoutes(router *mux.Router) {
	router.HandleFunc("/user-to-projects", linkUserToProject).Methods("POST")
	router.HandleFunc("/users/{id}/projects", getProjectsForUser).Methods("GET")
	router.HandleFunc("/projects/{id}/users", getUsersForProject).Methods("GET")
}

//API設定
func linkUserToProject(w http.ResponseWriter, r *http.Request) {
	var relation UserToProject
	if err := json.NewDecoder(r.Body).Decode(&relation); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := db.Create(&relation).Error; err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(relation)
}

func getProjectsForUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	userID := params["id"]

	var user User

	if err := db.Preload("Projects").First(&user, userID).Error; err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user.Projects)
}

func getUsersForProject(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	projectID := params["id"]

	var project Project
	if err := db.Preload("Users").First(&project, projectID).Error; err != nil {
		http.Error(w, "Project not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project.Users)
}
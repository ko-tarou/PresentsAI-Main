package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

type Project struct {
	ID        uint      `gorm:"primaryKey"`
	Title      string    `gorm:"size:100;unique;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`

	Users []User `gorm:"many2many:user_to_projects;constraint:OnDelete:CASCADE;"`
}


//route設定
func RegisterProjectRoutes(router *mux.Router) {
	router.HandleFunc("/projects", createProject).Methods("POST")
	router.HandleFunc("/projects", getProjects).Methods("GET")
	router.HandleFunc("/projects/{id}", deleteProject).Methods("DELETE")
}

//API設定
func createProject(w http.ResponseWriter, r *http.Request) {
	var project Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := db.Create(&project).Error; err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(project)
}

func getProjects(w http.ResponseWriter, r *http.Request) {
	var projects []Project
	if err := db.Find(&projects).Error; err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func deleteProject(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	if err := db.Delete(&Project{}, id).Error; err != nil {
		http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Project with ID " + id + " deleted"))
}
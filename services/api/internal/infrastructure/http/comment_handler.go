package http

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/postgres"
	"gorm.io/gorm"
)

type CommentHandler struct{ db *gorm.DB }

func NewCommentHandler(db *gorm.DB) *CommentHandler { return &CommentHandler{db: db} }

func (h *CommentHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	presentationID := mux.Vars(r)["id"]
	var comments []postgres.CommentModel
	h.db.Where("presentation_id = ?", presentationID).Order("created_at ASC").Find(&comments)
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": comments})
}

func (h *CommentHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
	ownerID, _ := r.Context().Value(middleware.UserIDKey).(string)
	presentationID := mux.Vars(r)["id"]
	var req struct {
		SlideID string `json:"slideId"`
		Body    string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Body == "" {
		writeError(w, http.StatusBadRequest, "body required")
		return
	}
	c := postgres.CommentModel{
		PresentationID: presentationID, SlideID: req.SlideID,
		AuthorID: ownerID, Body: req.Body,
	}
	h.db.Create(&c)
	writeJSON(w, http.StatusCreated, c)
}

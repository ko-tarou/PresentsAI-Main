package http

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/postgres"
	"gorm.io/gorm"
)

type VersionHandler struct{ db *gorm.DB }

func NewVersionHandler(db *gorm.DB) *VersionHandler { return &VersionHandler{db: db} }

func (h *VersionHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	slideID := mux.Vars(r)["slideId"]
	var versions []postgres.SlideVersionModel
	h.db.Where("slide_id = ?", slideID).Order("version DESC").Limit(20).Find(&versions)
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": versions})
}

func (h *VersionHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
	authorID, _ := r.Context().Value(middleware.UserIDKey).(string)
	slideID := mux.Vars(r)["slideId"]
	var req struct {
		Content postgres.JSONB `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	var count int64
	h.db.Model(&postgres.SlideVersionModel{}).Where("slide_id = ?", slideID).Count(&count)
	v := postgres.SlideVersionModel{
		SlideID:  slideID,
		Version:  int(count) + 1,
		Content:  req.Content,
		AuthorID: authorID,
	}
	h.db.Create(&v)
	writeJSON(w, http.StatusCreated, v)
}

func (h *VersionHandler) HandleRestore(w http.ResponseWriter, r *http.Request) {
	slideID := mux.Vars(r)["slideId"]
	versionID := mux.Vars(r)["versionId"]
	var ver postgres.SlideVersionModel
	if err := h.db.First(&ver, "id = ? AND slide_id = ?", versionID, slideID).Error; err != nil {
		writeError(w, http.StatusNotFound, "version not found")
		return
	}
	h.db.Model(&postgres.SlideModel{}).Where("id = ?", slideID).Update("content", ver.Content)
	writeJSON(w, http.StatusOK, map[string]string{"restored": versionID})
}

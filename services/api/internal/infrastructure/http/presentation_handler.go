package http

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	appPresentation "github.com/ko-tarou/presentsai/services/api/internal/application/presentation"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
)

type PresentationHandler struct {
	uc *appPresentation.UseCase
}

func NewPresentationHandler(uc *appPresentation.UseCase) *PresentationHandler {
	return &PresentationHandler{uc: uc}
}

func (h *PresentationHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	items, total, err := h.uc.List(r.Context(), ownerID, 50, 0)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list presentations")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": items, "total": total})
}

func (h *PresentationHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	var req struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Title = "Untitled"
	}
	if req.Title == "" {
		req.Title = "Untitled"
	}
	p, err := h.uc.Create(r.Context(), appPresentation.CreateInput{OwnerID: ownerID, Title: req.Title})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create presentation")
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (h *PresentationHandler) HandleGet(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	id := mux.Vars(r)["id"]
	p, err := h.uc.Get(r.Context(), id, ownerID)
	if err != nil {
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *PresentationHandler) HandleUpdate(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	id := mux.Vars(r)["id"]
	var req struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}
	p, err := h.uc.Update(r.Context(), id, ownerID, req.Title)
	if err != nil {
		writeHTTPError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *PresentationHandler) HandleDelete(w http.ResponseWriter, r *http.Request) {
	ownerID := r.Context().Value(middleware.UserIDKey).(string)
	id := mux.Vars(r)["id"]
	if err := h.uc.Delete(r.Context(), id, ownerID); err != nil {
		writeHTTPError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

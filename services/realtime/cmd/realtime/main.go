package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

type Session struct {
	mu        sync.RWMutex
	presenter *websocket.Conn
	viewers   map[*websocket.Conn]bool
}

var sessions = make(map[string]*Session)
var sessionsMu sync.RWMutex

func getSession(id string) *Session {
	sessionsMu.Lock()
	defer sessionsMu.Unlock()
	if s, ok := sessions[id]; ok {
		return s
	}
	s := &Session{viewers: make(map[*websocket.Conn]bool)}
	sessions[id] = s
	return s
}

func handlePresenter(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session")
	if sessionID == "" {
		http.Error(w, "session required", 400)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	sess := getSession(sessionID)
	sess.mu.Lock()
	sess.presenter = conn
	sess.mu.Unlock()
	defer func() {
		sess.mu.Lock()
		sess.presenter = nil
		sess.mu.Unlock()
		conn.Close()
	}()
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		sess.mu.RLock()
		for v := range sess.viewers {
			v.WriteMessage(websocket.TextMessage, msg)
		}
		sess.mu.RUnlock()
	}
}

func handleViewer(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session")
	if sessionID == "" {
		http.Error(w, "session required", 400)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	sess := getSession(sessionID)
	sess.mu.Lock()
	sess.viewers[conn] = true
	sess.mu.Unlock()
	defer func() {
		sess.mu.Lock()
		delete(sess.viewers, conn)
		sess.mu.Unlock()
		conn.Close()
	}()
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

func main() {
	godotenv.Load()
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "presentsai-realtime"})
	})
	mux.HandleFunc("/presenter", handlePresenter)
	mux.HandleFunc("/viewer", handleViewer)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	log.Printf("realtime service starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

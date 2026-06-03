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

type Room struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
	state   []byte
}

var rooms = make(map[string]*Room)
var roomsMu sync.RWMutex

func getRoom(id string) *Room {
	roomsMu.Lock(); defer roomsMu.Unlock()
	if r, ok := rooms[id]; ok { return r }
	r := &Room{clients: make(map[*websocket.Conn]bool)}
	rooms[id] = r; return r
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room")
	if roomID == "" { http.Error(w, "room required", 400); return }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil { return }
	room := getRoom(roomID)
	room.mu.Lock()
	room.clients[conn] = true
	if len(room.state) > 0 { conn.WriteMessage(websocket.BinaryMessage, room.state) }
	room.mu.Unlock()
	defer func() { room.mu.Lock(); delete(room.clients, conn); room.mu.Unlock(); conn.Close() }()
	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil { break }
		room.mu.Lock()
		room.state = msg
		for c := range room.clients { if c != conn { c.WriteMessage(mt, msg) } }
		room.mu.Unlock()
	}
}

func main() {
	godotenv.Load()
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type","application/json")
		json.NewEncoder(w).Encode(map[string]string{"status":"ok","service":"presentsai-collab"})
	})
	mux.HandleFunc("/ws", handleWS)
	port := os.Getenv("PORT"); if port == "" { port = "8081" }
	log.Printf("collab service starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// Command collab is a y-websocket compatible relay server for PresentsAI.
//
// It speaks the y-protocol message framing (sync / awareness) and relays
// opaque Yjs updates between clients in the same room. It does NOT interpret
// CRDT contents; the authoritative merge happens in each client's Yjs doc
// (ADR-0010/0011). The opaque update log is persisted via internal/store
// (PostgreSQL when DATABASE_URL is set, else in-memory), so room state survives
// restarts and the server re-seeds every newcomer (single-seed model).
//
// y-websocket connects to `ws://host:port/{roomname}`, so the room id is the
// URL path segment.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"

	"github.com/ko-tarou/presentsai/services/collab/internal/hub"
	"github.com/ko-tarou/presentsai/services/collab/internal/store"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

// wsClient adapts a websocket connection to hub.Client. Outbound frames are
// queued on a buffered channel and written by a single writer goroutine, so
// the hub never blocks on slow sockets and gorilla's one-writer rule holds.
type wsClient struct {
	conn *websocket.Conn
	send chan []byte
}

func newWSClient(conn *websocket.Conn) *wsClient {
	return &wsClient{conn: conn, send: make(chan []byte, 256)}
}

// Send queues a frame for delivery. If the buffer is full the client is
// considered too slow; the frame is dropped (Yjs re-syncs on reconnect).
func (c *wsClient) Send(data []byte) {
	select {
	case c.send <- data:
	default:
		log.Printf("collab: dropping frame for slow client")
	}
}

// writePump drains the send channel to the socket. It exits when the channel
// is closed, then closes the connection.
func (c *wsClient) writePump() {
	defer c.conn.Close()
	for data := range c.send {
		if err := c.conn.WriteMessage(websocket.BinaryMessage, data); err != nil {
			return
		}
	}
}

// roomID extracts the room name from the request path. y-websocket uses
// `ws://host/{roomname}`; we also accept a legacy `?room=` query param.
func roomID(r *http.Request) string {
	if q := r.URL.Query().Get("room"); q != "" {
		return q
	}
	return strings.Trim(r.URL.Path, "/")
}

func makeHandler(h *hub.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := roomID(r)
		if id == "" {
			http.Error(w, "room required", http.StatusBadRequest)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		room := h.Room(id)
		client := newWSClient(conn)
		room.Join(client)
		go client.writePump()

		defer func() {
			room.Leave(client)
			close(client.send) // stops writePump, which closes the conn
		}()

		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			if mt != websocket.BinaryMessage {
				continue // y-protocol frames are always binary
			}
			room.HandleMessage(client, msg)
		}
	}
}

// newStore picks the persistence backend: Postgres when DATABASE_URL is set,
// otherwise an in-memory store (no durability). A Postgres failure is fatal so
// misconfiguration is loud rather than silently losing collaborative state.
func newStore() store.Store {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Printf("collab: DATABASE_URL unset, using in-memory store (no persistence)")
		return store.NewMemStore()
	}
	pg, err := store.NewPostgresStore(dsn)
	if err != nil {
		log.Fatalf("collab: postgres store init failed: %v", err)
	}
	log.Printf("collab: using PostgreSQL persistence")
	return pg
}

func main() {
	godotenv.Load()
	h := hub.New(newStore())

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "presentsai-collab"})
	})
	// y-websocket connects to /{roomname}; "/" catches every room path.
	mux.HandleFunc("/", makeHandler(h))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Printf("collab service starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

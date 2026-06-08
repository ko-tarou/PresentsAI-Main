// Package hub implements the transport-agnostic relay core for the collab
// server. It manages rooms (one per presentation), stores the opaque Yjs
// update log for each room, and computes the outbound messages for every
// inbound y-protocol message.
//
// The relay is deliberately CRDT-agnostic (ADR-0010/0011): the authoritative
// merge happens in each client's Yjs instance. The server only stores and
// forwards opaque update bytes. The convergence strategy is:
//
//   - On SyncStep1 from a client: reply with every stored update (as Update
//     messages) so the newcomer catches up, then send our own SyncStep1 with
//     an empty state vector so the client pushes us its full state.
//   - On SyncStep2 / Update: append the opaque update to the room log and
//     broadcast it to every other client as an Update message.
//   - On awareness / queryAwareness: relay to other clients without storing
//     (awareness is ephemeral presence state).
//
// This strategy is validated to converge against real Yjs clients (see tests).
package hub

import (
	"sync"

	"github.com/ko-tarou/presentsai/services/collab/internal/yproto"
)

// Client is anything the hub can push outbound binary frames to. The
// websocket transport implements this; tests use an in-memory fake.
type Client interface {
	// Send delivers one binary websocket frame to the client. It must be
	// safe to call from the hub's goroutine and should not block
	// indefinitely (implementations typically buffer or drop on a full
	// queue).
	Send(data []byte)
}

// Room holds the connected clients and the accumulated opaque update log
// for a single presentation.
type Room struct {
	mu      sync.RWMutex
	clients map[Client]struct{}
	// updates is the append-only log of opaque Yjs updates seen in this
	// room. Order is not significant for correctness (Yjs merges are
	// commutative & idempotent) but is preserved for determinism.
	updates [][]byte
}

func newRoom() *Room {
	return &Room{clients: make(map[Client]struct{})}
}

// Hub manages all rooms.
type Hub struct {
	mu    sync.Mutex
	rooms map[string]*Room
}

// New returns an empty Hub.
func New() *Hub { return &Hub{rooms: make(map[string]*Room)} }

// Room returns the room with the given id, creating it on first use.
func (h *Hub) Room(id string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[id]
	if !ok {
		r = newRoom()
		h.rooms[id] = r
	}
	return r
}

// RoomCount reports how many rooms currently exist (test/observability).
func (h *Hub) RoomCount() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.rooms)
}

// Join registers c as a member of the room.
func (r *Room) Join(c Client) {
	r.mu.Lock()
	r.clients[c] = struct{}{}
	r.mu.Unlock()
}

// Leave removes c from the room.
func (r *Room) Leave(c Client) {
	r.mu.Lock()
	delete(r.clients, c)
	r.mu.Unlock()
}

// ClientCount reports the number of connected clients (test/observability).
func (r *Room) ClientCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.clients)
}

// UpdateCount reports the number of stored opaque updates (test/observability).
func (r *Room) UpdateCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.updates)
}

// HandleMessage processes one inbound y-protocol frame from sender. It mutates
// the room state (appending updates) and pushes outbound frames directly to
// the relevant clients via their Send method:
//
//   - replies (catch-up snapshot, our SyncStep1) go to sender,
//   - broadcasts (relayed updates / awareness) go to every other client.
//
// Unknown or malformed messages are ignored (best-effort relay).
func (r *Room) HandleMessage(sender Client, msg []byte) {
	dec := yproto.NewDecoder(msg)
	mtype, err := dec.ReadVarUint()
	if err != nil {
		return
	}

	switch int(mtype) {
	case yproto.MessageSync:
		r.handleSync(sender, dec, msg)
	case yproto.MessageAwareness, yproto.MessageQueryAwareness:
		// Awareness is ephemeral: relay the original frame verbatim to
		// other clients and never store it.
		r.broadcast(sender, msg)
	default:
		// Unknown message type: ignore.
	}
}

func (r *Room) handleSync(sender Client, dec *yproto.Decoder, original []byte) {
	step, err := dec.ReadVarUint()
	if err != nil {
		return
	}
	switch int(step) {
	case yproto.SyncStep1:
		// The peer announced its state vector. As an opaque relay we
		// cannot diff against it, so we (a) send every stored update so
		// the peer catches up, then (b) send our own SyncStep1 with an
		// empty state vector so the peer replies with its full state.
		r.replaySnapshot(sender)
		sender.Send(yproto.EncodeSyncStep1(yproto.EmptyStateVector))

	case yproto.SyncStep2, yproto.SyncUpdate:
		// Both carry an opaque update payload. Store it, then broadcast
		// to the other clients as a normalized Update message.
		update, err := dec.ReadVarUint8Array()
		if err != nil {
			return
		}
		stored := append([]byte(nil), update...) // copy: msg buffer is reused
		r.mu.Lock()
		r.updates = append(r.updates, stored)
		r.mu.Unlock()
		r.broadcast(sender, yproto.EncodeSyncUpdate(stored))

	default:
		// Unknown sync step: ignore.
	}
}

// replaySnapshot sends every stored update to c as individual Update messages.
// Yjs applies them idempotently regardless of order, reconstructing the room
// state in the newcomer's document.
func (r *Room) replaySnapshot(c Client) {
	r.mu.RLock()
	snapshot := make([][]byte, len(r.updates))
	copy(snapshot, r.updates)
	r.mu.RUnlock()
	for _, u := range snapshot {
		c.Send(yproto.EncodeSyncUpdate(u))
	}
}

// broadcast sends data to every client in the room except the sender.
func (r *Room) broadcast(sender Client, data []byte) {
	r.mu.RLock()
	targets := make([]Client, 0, len(r.clients))
	for c := range r.clients {
		if c != sender {
			targets = append(targets, c)
		}
	}
	r.mu.RUnlock()
	for _, c := range targets {
		c.Send(data)
	}
}

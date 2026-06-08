// Package store persists the opaque Yjs update log per room so that room
// state survives server restarts and every client (not just the first joiner)
// can be re-seeded from the server (ADR-0011 single-seed model).
//
// The store is deliberately CRDT-agnostic: it stores and returns opaque update
// bytes in append order. The authoritative merge still happens in each client's
// Yjs document. A Store implementation only needs to (a) append an opaque
// payload to a room's log and (b) load a room's full log on demand.
package store

// Store is the persistence boundary for the per-room Yjs update log.
//
// Implementations must be safe for concurrent use by multiple goroutines.
type Store interface {
	// Load returns every stored update for the room in append order. A room
	// with no history returns an empty slice (never an error for "not found").
	Load(room string) ([][]byte, error)
	// Append durably records one opaque update for the room. The payload is
	// owned by the caller after the call returns; implementations that retain
	// it must copy.
	Append(room string, payload []byte) error
}

package store

import "sync"

// MemStore is an in-memory Store. It is the default persistence backend (used
// when no database is configured) and the backend exercised by unit tests.
// Data does not survive a process restart.
type MemStore struct {
	mu   sync.RWMutex
	logs map[string][][]byte
}

// NewMemStore returns an empty in-memory store.
func NewMemStore() *MemStore {
	return &MemStore{logs: make(map[string][][]byte)}
}

// Load returns a copy of the room's update log in append order.
func (s *MemStore) Load(room string) ([][]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	log := s.logs[room]
	out := make([][]byte, len(log))
	copy(out, log)
	return out, nil
}

// Append copies and records one opaque update for the room.
func (s *MemStore) Append(room string, payload []byte) error {
	stored := append([]byte(nil), payload...)
	s.mu.Lock()
	s.logs[room] = append(s.logs[room], stored)
	s.mu.Unlock()
	return nil
}

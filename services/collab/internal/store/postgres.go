package store

import (
	"database/sql"

	_ "github.com/lib/pq"
)

// schema is applied on open; additive and idempotent so it is safe to run on
// every boot. `seq` orders updates within a room; the payload is the opaque
// Yjs update bytes (bytea), never interpreted server-side.
const schema = `
CREATE TABLE IF NOT EXISTS yjs_updates (
    room    TEXT   NOT NULL,
    seq     BIGSERIAL,
    payload BYTEA  NOT NULL,
    PRIMARY KEY (room, seq)
);
CREATE INDEX IF NOT EXISTS yjs_updates_room_seq ON yjs_updates (room, seq);
`

// PostgresStore persists the per-room update log in PostgreSQL. It is selected
// when DATABASE_URL is set; otherwise the server falls back to MemStore.
type PostgresStore struct {
	db *sql.DB
}

// NewPostgresStore opens a connection pool to dsn and ensures the schema
// exists. The caller owns Close().
func NewPostgresStore(dsn string) (*PostgresStore, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	return &PostgresStore{db: db}, nil
}

// Close releases the underlying connection pool.
func (s *PostgresStore) Close() error { return s.db.Close() }

// Load returns the room's updates ordered by seq.
func (s *PostgresStore) Load(room string) ([][]byte, error) {
	rows, err := s.db.Query(
		`SELECT payload FROM yjs_updates WHERE room = $1 ORDER BY seq`, room)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out [][]byte
	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			return nil, err
		}
		out = append(out, payload)
	}
	return out, rows.Err()
}

// Append durably records one opaque update for the room.
func (s *PostgresStore) Append(room string, payload []byte) error {
	_, err := s.db.Exec(
		`INSERT INTO yjs_updates (room, payload) VALUES ($1, $2)`, room, payload)
	return err
}

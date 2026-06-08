// Package yproto implements the minimal subset of the y-protocol message
// framing needed to act as a y-websocket compatible relay.
//
// The server NEVER interprets CRDT contents: Yjs updates and awareness
// payloads are handled as opaque byte slices. We only need to parse the
// outer framing (message type + lib0 var-uint length prefixes) so we can
// route messages correctly.
//
// Wire format (all binary websocket frames):
//
//	[varUint messageType] [payload...]
//
// messageType:
//
//	0 = sync           payload: [varUint syncStep] [...]
//	1 = awareness      payload: [varUint8Array awarenessUpdate]
//	3 = queryAwareness payload: (empty)
//
// sync step:
//
//	0 = SyncStep1      payload: [varUint8Array stateVector]
//	1 = SyncStep2      payload: [varUint8Array update]
//	2 = Update         payload: [varUint8Array update]
//
// var-uint / var-uint8array follow the lib0 encoding used by y-protocols.
package yproto

import "errors"

// Message types (must match y-websocket constants).
const (
	MessageSync           = 0
	MessageAwareness      = 1
	MessageQueryAwareness = 3
)

// Sync sub-message steps (must match y-protocols/sync constants).
const (
	SyncStep1  = 0
	SyncStep2  = 1
	SyncUpdate = 2
)

// ErrTruncated is returned when a buffer ends before a value is fully read.
var ErrTruncated = errors.New("yproto: truncated message")

// EmptyStateVector is the lib0 encoding of an empty Yjs state vector
// (a var-uint map length of 0). Sending SyncStep1 with this state vector
// asks the peer to reply with its *entire* document state, which lets an
// opaque relay request a full snapshot without understanding CRDT internals.
var EmptyStateVector = []byte{0}

// Decoder reads lib0-encoded values from a byte slice.
type Decoder struct {
	buf []byte
	pos int
}

// NewDecoder wraps b for reading.
func NewDecoder(b []byte) *Decoder { return &Decoder{buf: b} }

// ReadVarUint reads an unsigned lib0 variable-length integer.
func (d *Decoder) ReadVarUint() (uint64, error) {
	var num uint64
	var shift uint
	for {
		if d.pos >= len(d.buf) {
			return 0, ErrTruncated
		}
		b := d.buf[d.pos]
		d.pos++
		num |= uint64(b&0x7f) << shift
		if b&0x80 == 0 {
			return num, nil
		}
		shift += 7
		if shift > 63 {
			return 0, errors.New("yproto: var-uint overflow")
		}
	}
}

// ReadVarUint8Array reads a length-prefixed byte slice. The returned slice
// aliases the underlying buffer; copy it if it must outlive the buffer.
func (d *Decoder) ReadVarUint8Array() ([]byte, error) {
	n, err := d.ReadVarUint()
	if err != nil {
		return nil, err
	}
	if d.pos+int(n) > len(d.buf) {
		return nil, ErrTruncated
	}
	out := d.buf[d.pos : d.pos+int(n)]
	d.pos += int(n)
	return out, nil
}

// Encoder writes lib0-encoded values to an internal buffer.
type Encoder struct {
	buf []byte
}

// NewEncoder returns an empty encoder.
func NewEncoder() *Encoder { return &Encoder{} }

// WriteVarUint appends an unsigned lib0 variable-length integer.
func (e *Encoder) WriteVarUint(num uint64) {
	for num > 0x7f {
		e.buf = append(e.buf, byte(0x80|(num&0x7f)))
		num >>= 7
	}
	e.buf = append(e.buf, byte(num&0x7f))
}

// WriteVarUint8Array appends a length-prefixed byte slice.
func (e *Encoder) WriteVarUint8Array(b []byte) {
	e.WriteVarUint(uint64(len(b)))
	e.buf = append(e.buf, b...)
}

// Bytes returns the accumulated buffer.
func (e *Encoder) Bytes() []byte { return e.buf }

// EncodeSyncUpdate frames an opaque Yjs update as a sync/Update message,
// the canonical way to relay a single update to other clients.
func EncodeSyncUpdate(update []byte) []byte {
	e := NewEncoder()
	e.WriteVarUint(MessageSync)
	e.WriteVarUint(SyncUpdate)
	e.WriteVarUint8Array(update)
	return e.Bytes()
}

// EncodeSyncStep1 frames a SyncStep1 carrying the given state vector.
func EncodeSyncStep1(stateVector []byte) []byte {
	e := NewEncoder()
	e.WriteVarUint(MessageSync)
	e.WriteVarUint(SyncStep1)
	e.WriteVarUint8Array(stateVector)
	return e.Bytes()
}

// EncodeSyncStep2 frames a SyncStep2 carrying an opaque update.
func EncodeSyncStep2(update []byte) []byte {
	e := NewEncoder()
	e.WriteVarUint(MessageSync)
	e.WriteVarUint(SyncStep2)
	e.WriteVarUint8Array(update)
	return e.Bytes()
}

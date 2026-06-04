package terminal

type Emulator interface {
	Write(data []byte) (int, error)
	Read(p []byte) (int, error)
	Resize(rows, cols uint16) error
}

// BasicEmulator implements the Emulator interface for a simple PTY-based terminal.
type BasicEmulator struct {
	// Future implementation details like vt100 parsing would go here.
}

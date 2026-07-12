package terminal

import "fmt"

func (i *PTYInstance) Transmit(data string) {
	// In a full implementation, this would push to a websocket or channel
	fmt.Printf("PTY [%s]: %s\n", i.ID, data)
}

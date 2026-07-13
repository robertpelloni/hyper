package agent

import (
	"fmt"
	"time"
)

type AutonomousHarness struct {
	Active   bool
	MaxSteps int
}

func NewAutonomousHarness() *AutonomousHarness {
	return &AutonomousHarness{
		Active:   false,
		MaxSteps: 50,
	}
}

func (h *AutonomousHarness) StartLoop(goal string) {
	h.Active = true
	fmt.Printf("Starting autonomous loop for goal: %s\n", goal)
	go func() {
		for i := 0; i < h.MaxSteps && h.Active; i++ {
			fmt.Printf("Agent Step %d: Thinking...\n", i+1)
			time.Sleep(1 * time.Second) // Simulate LLM latency
			fmt.Printf("Agent Step %d: Executing Tool...\n", i+1)
			// Simulate tool execution
			time.Sleep(500 * time.Millisecond)
		}
		fmt.Println("Autonomous loop finished or reached max steps.")
		h.Active = false
	}()
}

func (h *AutonomousHarness) StopLoop() {
	h.Active = false
	fmt.Println("Autonomous loop stopped.")
}

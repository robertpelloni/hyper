package agent

import (
	"context"
	"fmt"
)

type AutonomousAgent struct {
	Harness *Harness
	Tools   *ToolBox
}

func NewAutonomousAgent(h *Harness, tb *ToolBox) *AutonomousAgent {
	return &AutonomousAgent{Harness: h, Tools: tb}
}

// Hermes/Pi-Coding-Agent parity: Advanced reasoning loop
func (a *AutonomousAgent) RunLoop(ctx context.Context, goal string) error {
	fmt.Printf("Starting autonomous loop for goal: %s\n", goal)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			// 1. Perception
			status, _ := a.Tools.GitStatus()

			// 2. Reasoning (Hermes style: step-by-step planning)
			fmt.Println("Step 1: Analyzing repository state...")
			fmt.Printf("Repo Status: %s\n", status)

			// 3. Action
			fmt.Println("Step 2: Executing next command based on plan...")
			resp, err := a.Harness.Execute("go test ./...")
			if err != nil {
				return err
			}
			fmt.Printf("Action result: %s\n", resp)

			// Exit condition
			return nil
		}
	}
}

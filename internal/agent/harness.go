package agent

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// StepType defines the phase of autonomous agent reasoning
type StepType string

const (
	StepPlan    StepType = "PLAN"
	StepThink   StepType = "THINK"
	StepAct     StepType = "ACT"
	StepObserve StepType = "OBSERVE"
	StepReflect StepType = "REFLECT"
)

// ReasoningStep captures a single discrete cognitive step in the execution loop
type ReasoningStep struct {
	ID        string    `json:"id"`
	Type      StepType  `json:"type"`
	Content   string    `json:"content"`
	Tool      string    `json:"tool,omitempty"`
	Duration  int64     `json:"durationMs,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// StepCallback is invoked whenever a reasoning step is completed
type StepCallback func(step ReasoningStep)

// Agent represents the autonomous reasoning harness with step telemetry
type Agent struct {
	mu           sync.RWMutex
	Messages     []string
	Steps        []ReasoningStep
	stepCallback StepCallback
	isRunning    bool
}

// NewAgent creates an initialized Agent harness
func NewAgent() *Agent {
	return &Agent{
		Messages: make([]string, 0),
		Steps:    make([]ReasoningStep, 0),
	}
}

// SetStepCallback registers a telemetry listener for reasoning steps
func (a *Agent) SetStepCallback(cb StepCallback) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.stepCallback = cb
}

// RecordStep logs a reasoning step and dispatches to the callback if registered
func (a *Agent) RecordStep(stepType StepType, content, tool string, durationMs int64) ReasoningStep {
	a.mu.Lock()
	step := ReasoningStep{
		ID:        fmt.Sprintf("step_%d", time.Now().UnixNano()),
		Type:      stepType,
		Content:   content,
		Tool:      tool,
		Duration:  durationMs,
		Timestamp: time.Now(),
	}
	a.Steps = append(a.Steps, step)
	cb := a.stepCallback
	a.mu.Unlock()

	if cb != nil {
		cb(step)
	}
	return step
}

// GetSteps returns a copy of all recorded reasoning steps
func (a *Agent) GetSteps() []ReasoningStep {
	a.mu.RLock()
	defer a.mu.RUnlock()
	res := make([]ReasoningStep, len(a.Steps))
	copy(res, a.Steps)
	return res
}

// AddMessage appends a message to internal state
func (a *Agent) AddMessage(msg string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.Messages = append(a.Messages, msg)
}

// GetMessages returns a copy of message history
func (a *Agent) GetMessages() []string {
	a.mu.RLock()
	defer a.mu.RUnlock()
	res := make([]string, len(a.Messages))
	copy(res, a.Messages)
	return res
}

// IsRunning reports whether the agent loop is currently active
func (a *Agent) IsRunning() bool {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.isRunning
}

// RunLoop runs the autonomous think-act-observe cycle until context is cancelled
func (a *Agent) RunLoop(ctx context.Context) error {
	a.mu.Lock()
	a.isRunning = true
	a.mu.Unlock()

	defer func() {
		a.mu.Lock()
		a.isRunning = false
		a.mu.Unlock()
	}()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(50 * time.Millisecond):
			// Cognitive cycle iteration
		}
	}
}

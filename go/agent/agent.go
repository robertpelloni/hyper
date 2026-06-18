package agent

type Agent struct {
	State         map[string]interface{}
	Listeners     map[string]bool
	SteeringQueue []string
	FollowUpQueue []string
}

func NewAgent() *Agent {
	return &Agent{
		State:         make(map[string]interface{}),
		Listeners:     make(map[string]bool),
		SteeringQueue: make([]string, 0),
		FollowUpQueue: make([]string, 0),
	}
}

func (a *Agent) AddListener(listener string) {
	a.Listeners[listener] = true
}

func (a *Agent) RemoveListener(listener string) {
	delete(a.Listeners, listener)
}
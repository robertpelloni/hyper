package agent

type TabbyCompletionRequest struct {
	Prompt string `json:"prompt"`
}

type TabbyCompletionResponse struct {
	Choices []struct {
		Text string `json:"text"`
	} `json:"choices"`
}

func HandleTabbyCompletion(req TabbyCompletionRequest) TabbyCompletionResponse {
	return TabbyCompletionResponse{
		Choices: []struct {
			Text string `json:"text"`
		}{
			{Text: "/* Tabby-style completion result */"},
		},
	}
}

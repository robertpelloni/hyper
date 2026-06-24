package copilot

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

type ShellExecutor struct {
	reader *bufio.Reader
}

func NewShellExecutor() *ShellExecutor {
	return &ShellExecutor{
		reader: bufio.NewReader(os.Stdin),
	}
}

func (s *ShellExecutor) ExecuteWithConfirmation(command, explanation string) (bool, error) {
	fmt.Printf("\nSuggestion: %s\n", command)
	fmt.Printf("Explanation: %s\n", explanation)
	fmt.Print("\nExecute this command? [y/N] ")

	input, err := s.reader.ReadString('\n')
	if err != nil {
		return false, err
	}

	answer := strings.ToLower(strings.TrimSpace(input))
	if answer == "y" || answer == "yes" {
		fmt.Printf("Executing: %s...\n", command)

		var cmd *exec.Cmd
		if runtime.GOOS == "windows" {
			cmd = exec.Command("cmd", "/C", command)
		} else {
			cmd = exec.Command("sh", "-c", command)
		}

		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		err := cmd.Run()
		if err != nil {
			fmt.Printf("Error: %v\n", err)
		}
		return true, nil
	}

	fmt.Println("Command execution cancelled.")
	return false, nil
}
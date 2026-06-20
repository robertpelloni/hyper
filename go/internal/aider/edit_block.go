package aider

// Re-implementation of Aider's SEARCH/REPLACE diff format patch application

import (
	"regexp"
	"strings"
	"fmt"
)

type EditBlock struct {
	Search  string
	Replace string
}

func ParseEditBlocks(llmResponse string) []EditBlock {
	var blocks []EditBlock
	re := regexp.MustCompile(`(?s)<<<<<<< SEARCH\n(.*?)=======\n(.*?)>>>>>>> REPLACE`)
	matches := re.FindAllStringSubmatch(llmResponse, -1)

	for _, match := range matches {
		if len(match) == 3 {
			blocks = append(blocks, EditBlock{
				Search:  match[1],
				Replace: match[2],
			})
		}
	}
	return blocks
}

func ApplyEditBlocks(fileContent string, blocks []EditBlock) string {
	newContent := fileContent
	for _, block := range blocks {
		if strings.Contains(newContent, block.Search) {
			newContent = strings.Replace(newContent, block.Search, block.Replace, 1)
		} else {
			fmt.Println("Warning: Could not find SEARCH block exactly.")
		}
	}
	return newContent
}

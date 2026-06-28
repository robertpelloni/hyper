package wave

import (
	"github.com/google/uuid"
	"time"
)

type CellType string

const (
	MarkdownCell CellType = "markdown"
	CodeCell     CellType = "code"
	TerminalCell CellType = "terminal"
)

type NotebookCell struct {
	ID        string   `json:"id"`
	Type      CellType `json:"type"`
	Content   string   `json:"content"`
	Output    string   `json:"output,omitempty"`
	CreatedAt int64    `json:"createdAt"`
}

type Notebook struct {
	ID    string         `json:"id"`
	Title string         `json:"title"`
	Cells []NotebookCell `json:"cells"`
}

type NotebookManager struct {
	notebooks map[string]*Notebook
}

func NewNotebookManager() *NotebookManager {
	return &NotebookManager{
		notebooks: make(map[string]*Notebook),
	}
}

func (m *NotebookManager) CreateNotebook(title string) *Notebook {
	id := uuid.New().String()
	nb := &Notebook{
		ID:    id,
		Title: title,
		Cells: []NotebookCell{},
	}
	m.notebooks[id] = nb
	return nb
}

func (m *NotebookManager) AddCell(notebookID string, cellType CellType, content string) *NotebookCell {
	nb, exists := m.notebooks[notebookID]
	if !exists {
		return nil
	}
	cell := NotebookCell{
		ID:        uuid.New().String(),
		Type:      cellType,
		Content:   content,
		CreatedAt: time.Now().UnixMilli(),
	}
	nb.Cells = append(nb.Cells, cell)
	return &cell
}

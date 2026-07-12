package intelligence

type Indexer interface {
	Index(path string) error
	Search(query string) ([]string, error)
}

type BasicIndexer struct {
	RootPath string
}

func (i *BasicIndexer) Index(path string) error {
	// Implementation based on Tabby's logic
	return nil
}

func (i *BasicIndexer) Search(query string) ([]string, error) {
	return []string{}, nil
}

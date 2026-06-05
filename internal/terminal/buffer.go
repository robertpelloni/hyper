package terminal

type Block struct {
	Command string
	Output  string
	Success bool
}

type Buffer struct {
	Blocks []Block
}

func (b *Buffer) AddBlock(cmd, output string, success bool) {
	b.Blocks = append(b.Blocks, Block{Command: cmd, Output: output, Success: success})
}

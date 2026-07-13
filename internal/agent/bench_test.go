package agent

import (
	"testing"
)

func BenchmarkAgentLoop(b *testing.B) {
	h := NewHarness()
	h.Start()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = h.Execute("status")
	}
}

func BenchmarkCompletion(b *testing.B) {
	h := NewHarness()
	h.Start()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = h.Execute("complete test")
	}
}

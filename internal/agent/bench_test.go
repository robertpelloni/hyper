package agent

import (
	"fmt"
	"testing"
)

func BenchmarkHarnessExecute_Simple(b *testing.B) {
	h := NewHarness()
	h.Start()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = h.Execute("status")
	}
}

func BenchmarkHarnessExecute_Complex(b *testing.B) {
	h := NewHarness()
	h.Start()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = h.Execute(fmt.Sprintf("complete some complex code for iteration %d", i))
	}
}

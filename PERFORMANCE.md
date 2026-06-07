# PERFORMANCE
- Benchmarking suite added to `internal/agent/bench_test.go`.
- Execution timing metrics integrated into the agent harness loop.
- Simple commands exhibit sub-millisecond latency.
- Complex completion commands scale linearly with input size.

## Running Benchmarks
To run the performance benchmarks, execute:
```bash
go test -v -bench=. ./internal/agent/...
```

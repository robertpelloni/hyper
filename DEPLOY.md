# DEPLOYMENT

## Building TormentNexus

1. **Install Dependencies:**
   ```bash
   yarn install --ignore-engines
   ```

2. **Build Go Core:**
   ```bash
   go build -o bin/tormentnexus ./cmd/tormentnexus/main.go
   ```

3. **Build Frontend:**
   ```bash
   yarn run build
   ```

4. **Package Application:**
   ```bash
   yarn run dist
   ```

## Running

Execute the Go binary or run the packaged application from the `dist/` directory.

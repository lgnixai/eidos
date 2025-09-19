package main

import (
    "encoding/json"
    "errors"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "sync"
)

// Simple file-backed store.
// Project structure: data/tables/<tableName>/{schema.json, records.json}

type Field struct {
    Name string `json:"name"`
    Type string `json:"type"` // string, number, boolean
}

type TableSchema struct {
    Name   string  `json:"name"`
    Fields []Field `json:"fields"`
}

type Record map[string]any

type Store struct {
    rootPath string
    mu       sync.RWMutex
}

func newStore(root string) *Store {
    return &Store{rootPath: root}
}

func (s *Store) ensure() error {
    s.mu.Lock()
    defer s.mu.Unlock()
    return os.MkdirAll(filepath.Join(s.rootPath, "tables"), 0o755)
}

func (s *Store) tableDir(name string) string {
    return filepath.Join(s.rootPath, "tables", name)
}

func (s *Store) schemaPath(name string) string {
    return filepath.Join(s.tableDir(name), "schema.json")
}

func (s *Store) recordsPath(name string) string {
    return filepath.Join(s.tableDir(name), "records.json")
}

func (s *Store) ListTables() ([]TableSchema, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    dir := filepath.Join(s.rootPath, "tables")
    entries, err := os.ReadDir(dir)
    if err != nil && !errors.Is(err, os.ErrNotExist) {
        return nil, err
    }
    var schemas []TableSchema
    for _, e := range entries {
        if !e.IsDir() {
            continue
        }
        b, err := os.ReadFile(filepath.Join(dir, e.Name(), "schema.json"))
        if err != nil {
            continue
        }
        var sc TableSchema
        if json.Unmarshal(b, &sc) == nil {
            schemas = append(schemas, sc)
        }
    }
    return schemas, nil
}

func (s *Store) CreateTable(schema TableSchema) error {
    if schema.Name == "" {
        return fmt.Errorf("name required")
    }
    s.mu.Lock()
    defer s.mu.Unlock()
    td := s.tableDir(schema.Name)
    if err := os.MkdirAll(td, 0o755); err != nil {
        return err
    }
    if _, err := os.Stat(s.schemaPath(schema.Name)); err == nil {
        return fmt.Errorf("table exists")
    }
    sb, _ := json.MarshalIndent(schema, "", "  ")
    if err := os.WriteFile(s.schemaPath(schema.Name), sb, 0o644); err != nil {
        return err
    }
    if err := os.WriteFile(s.recordsPath(schema.Name), []byte("[]"), 0o644); err != nil {
        return err
    }
    return nil
}

func (s *Store) ReadSchema(name string) (TableSchema, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var sc TableSchema
    b, err := os.ReadFile(s.schemaPath(name))
    if err != nil {
        return sc, err
    }
    err = json.Unmarshal(b, &sc)
    return sc, err
}

func (s *Store) UpdateSchema(name string, schema TableSchema) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if name != schema.Name && schema.Name != "" {
        // Do not allow renaming for simplicity
        return fmt.Errorf("renaming not supported")
    }
    sb, _ := json.MarshalIndent(schema, "", "  ")
    return os.WriteFile(s.schemaPath(name), sb, 0o644)
}

func (s *Store) ListRecords(name string) ([]Record, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    b, err := os.ReadFile(s.recordsPath(name))
    if err != nil {
        if errors.Is(err, os.ErrNotExist) {
            return []Record{}, nil
        }
        return nil, err
    }
    var recs []Record
    if err := json.Unmarshal(b, &recs); err != nil {
        return nil, err
    }
    return recs, nil
}

func (s *Store) AppendRecord(name string, rec Record) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    path := s.recordsPath(name)
    b, err := os.ReadFile(path)
    var recs []Record
    if err == nil {
        json.Unmarshal(b, &recs)
    }
    recs = append(recs, rec)
    nb, _ := json.MarshalIndent(recs, "", "  ")
    return os.WriteFile(path, nb, 0o644)
}

// HTTP handlers

type Server struct {
    store *Store
}

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    enc := json.NewEncoder(w)
    enc.SetEscapeHTML(false)
    _ = enc.Encode(v)
}

func readJSON(r *http.Request, v any) error {
    body, err := io.ReadAll(r.Body)
    if err != nil {
        return err
    }
    return json.Unmarshal(body, v)
}

func (s *Server) handleListTables(w http.ResponseWriter, r *http.Request) {
    tables, err := s.store.ListTables()
    if err != nil {
        writeJSON(w, 500, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, 200, tables)
}

func (s *Server) handleCreateTable(w http.ResponseWriter, r *http.Request) {
    var schema TableSchema
    if err := readJSON(r, &schema); err != nil {
        writeJSON(w, 400, map[string]string{"error": "invalid json"})
        return
    }
    if err := s.store.CreateTable(schema); err != nil {
        writeJSON(w, 400, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, 201, schema)
}

func (s *Server) handleGetSchema(w http.ResponseWriter, r *http.Request, table string) {
    sc, err := s.store.ReadSchema(table)
    if err != nil {
        writeJSON(w, 404, map[string]string{"error": "not found"})
        return
    }
    writeJSON(w, 200, sc)
}

func (s *Server) handleUpdateSchema(w http.ResponseWriter, r *http.Request, table string) {
    var sc TableSchema
    if err := readJSON(r, &sc); err != nil {
        writeJSON(w, 400, map[string]string{"error": "invalid json"})
        return
    }
    sc.Name = table
    if err := s.store.UpdateSchema(table, sc); err != nil {
        writeJSON(w, 400, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, 200, sc)
}

func (s *Server) handleListRecords(w http.ResponseWriter, r *http.Request, table string) {
    recs, err := s.store.ListRecords(table)
    if err != nil {
        writeJSON(w, 500, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, 200, recs)
}

func (s *Server) handleAppendRecord(w http.ResponseWriter, r *http.Request, table string) {
    var rec Record
    if err := readJSON(r, &rec); err != nil {
        writeJSON(w, 400, map[string]string{"error": "invalid json"})
        return
    }
    if err := s.store.AppendRecord(table, rec); err != nil {
        writeJSON(w, 500, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, 201, rec)
}

func (s *Server) routes() http.Handler {
    mux := http.NewServeMux()
    mux.HandleFunc("/api/tables", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case http.MethodGet:
            s.handleListTables(w, r)
        case http.MethodPost:
            s.handleCreateTable(w, r)
        default:
            w.WriteHeader(http.StatusMethodNotAllowed)
        }
    })
    mux.HandleFunc("/api/tables/", func(w http.ResponseWriter, r *http.Request) {
        // /api/tables/{table}/schema
        // /api/tables/{table}/records
        path := strings.TrimPrefix(r.URL.Path, "/api/tables/")
        parts := strings.Split(path, "/")
        if len(parts) < 2 {
            w.WriteHeader(http.StatusNotFound)
            return
        }
        table := parts[0]
        switch parts[1] {
        case "schema":
            switch r.Method {
            case http.MethodGet:
                s.handleGetSchema(w, r, table)
            case http.MethodPut:
                s.handleUpdateSchema(w, r, table)
            default:
                w.WriteHeader(http.StatusMethodNotAllowed)
            }
        case "records":
            switch r.Method {
            case http.MethodGet:
                s.handleListRecords(w, r, table)
            case http.MethodPost:
                s.handleAppendRecord(w, r, table)
            default:
                w.WriteHeader(http.StatusMethodNotAllowed)
            }
        default:
            w.WriteHeader(http.StatusNotFound)
        }
    })
    return mux
}

func main() {
    dataDir := filepath.Join(".", "data")
    store := newStore(dataDir)
    if err := store.ensure(); err != nil {
        log.Fatalf("failed to init store: %v", err)
    }
    srv := &Server{store: store}

    addr := ":8080"
    log.Printf("Server listening on %s", addr)
    if err := http.ListenAndServe(addr, withCORS(srv.routes())); err != nil {
        log.Fatal(err)
    }
}

func withCORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}


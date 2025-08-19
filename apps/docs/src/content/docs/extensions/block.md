---
title: Block
description: A universal UI extension framework that enables custom rendering and interaction capabilities.
sidebar:
  order: 3
  badge: RFC
---

The Block extension framework is a universal UI extension solution that provides a lightweight, single-file UI extension approach supporting React component rendering while maintaining reusability across different environments.

## 1. Design Principles

### 1.1 Lightweight Design

- Adopts a single-file component approach for easy code reuse across projects
- Complex components are recommended to be developed using conventional methods and published to npm
- Maintains separation of concerns to reduce maintenance overhead

### 1.2 Build-Free Development Experience

- Zero-config build with immediate preview of changes upon saving
- Automatically transforms imports to the latest external package versions
- Leverages the npm ecosystem while reducing version management complexity

### 1.3 Import Resolution Strategy

Uses standard Node.js import syntax with automatic resolution to external packages:

```tsx
// Standard import syntax
import { Excalidraw } from "@excalidraw/excalidraw"

// Automatically resolved to: https://esm.sh/@excalidraw/excalidraw
```

## 2. Built-in Component Library Integration

### 2.1 Shadcn/ui Integration

Provides seamless integration with Shadcn/ui components, enabling consistent UI styling with the Eidos interface:

```tsx
import { Button } from "@/components/ui/button"
```

Components share theme configurations with the main application while supporting independent theme customization.

### 2.2 AI-Assisted Development

Shadcn/ui's LLM-friendly architecture facilitates AI-assisted development, enabling code generation for simple scenarios without manual coding.

## 3. Runtime Environment

Block components execute in browser environments similar to standard React components. In Eidos Desktop, each block runs in an isolated domain:

```
<extid>.block.<spaceId>.eidos.localhost:13127
```

## 4. Extension Types and Specifications

### 4.1 Table View Extensions

Provide custom visualization options beyond the default grid, gallery, and kanban views.

#### Meta Configuration

```typescript
interface TableViewMeta {
  type: "tableView"
  componentName: string
  tableView: {
    title: string
    type: string // Built-in types: grid, gallery, kanban
    description: string
  }
}
```

#### Data Storage

Custom extension view type information is stored in the `eidos__views` table using the `ext__<type>` format:

- Built-in views: `grid`, `gallery`, `kanban`
- Custom extensions: `ext__list`, `ext__timeline`, `ext__chart`, etc.

#### URL Access Pattern

When rendering as a table view extension, the block will access the following URL structure:

```
<extid>.block.<spaceId>.eidos.localhost:13127/<tableid>/<viewid>
```

#### Implementation Example

```tsx
export const meta = {
  type: "tableView",
  componentName: "MyListView",
  tableView: {
    title: "List View",
    type: "list",
    description: "This is a list view",
  },
}

export function MyListView() {
  const [rows, setRows] = useState<any[]>([])

  // Get tableId and viewId from URL
  const pathParts = window.location.pathname.split("/")
  const tableId = pathParts[pathParts.length - 2]
  const viewId = pathParts[pathParts.length - 1]

  useEffect(() => {
    eidos.currentSpace.table(tableId).rows.query({}, { viewId }).then(setRows)
  }, [tableId, viewId])

  return (
    <div>
      {rows.map((row) => (
        <div key={row.id}>{row.title}</div>
      ))}
    </div>
  )
}
```

### 4.2 Extension Node Types

Provide custom node types beyond the default document and table nodes, with consistent directory tree behavior but custom rendering logic.

#### URL Access Pattern

```
<extid>.block.<spaceId>.eidos.localhost:13127/<nodeid>
```

#### Meta Configuration

```typescript
interface ExtNodeMeta {
  type: "extNode"
  componentName: string
  extNode: {
    title: string
    description: string
    type: string
  }
}
```

#### Implementation Examples

**Client-side Data Retrieval (Local Only):**

```tsx
export const meta = {
  type: "extNode",
  componentName: "MyExcalidraw",
  extNode: {
    title: "Excalidraw",
    description: "This is an excalidraw node",
    type: "excalidraw",
  },
}

export function MyExcalidraw() {
  const [initialData, setInitialData] = useState("")
  const nodeId = window.location.pathname.split("/").pop()

  useEffect(() => {
    eidos.currentSpace.extNode.getText(nodeId).then((text) => {
      setInitialData(JSON.parse(text))
    })
  }, [nodeId])

  return <Excalidraw initialData={initialData} />
}
```

**Server-side Data Retrieval (Publishable):**

```tsx
export const loader = async () => {
  const nodeid = request.url.split("/").pop()
  const text = await eidos.currentSpace.extNode.getText(nodeid)
  return { props: { text } }
}

export function MyExtNode({ text }: { text: string }) {
  return <div>{text}</div>
}
```

### 4.3 Default Component Override

Supports overriding default components, such as replacing the default Lexical-based document editor with alternative implementations:

```tsx
import Editor from "@monaco-editor/react"

export const meta = {
  type: "document",
  componentName: "MyDocument",
}

export function MyDocument() {
  if (ctx.type !== "document") {
    return <div>Not a document</div>
  }
  return <Editor />
}
```

## 5. Security Considerations

Extension execution should be properly sandboxed to prevent unauthorized system access. Implementations must validate component props and enforce appropriate isolation between extensions and the host application.

## 6. Implementation Requirements

- When specific extension functionality is required, a `meta` object conforming to the specified interface should be exported
- When no `meta` object is exported, the component runs as a regular React component
- When a `meta` object is exported, `meta.componentName` must match the actual exported component
- Proper error boundaries and loading states should be implemented
- When interacting with application data, data fetching must be performed through the Eidos SDK

## 7. Future Extensions

This specification may be extended to support additional extension types such as custom field renderers.

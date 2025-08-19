---
title: Block
description: 一个通用的 UI 扩展框架，实现自定义渲染和交互功能。
sidebar:
  order: 3
  badge: RFC
---

Block 扩展框架是一个通用的 UI 扩展解决方案，提供轻量级的单文件 UI 扩展方法，支持 React 组件渲染，同时在不同环境中保持可重用性。

## 1. 设计原则

### 1.1 轻量级设计

- 采用单文件组件方法，便于项目间重用代码
- 复杂组件建议使用传统方法开发并发布到 npm
- 保持关注点分离，减少维护开销

### 1.2 无构建开发体验

- 零配置构建，保存后立即预览更改
- 自动将导入转换为最新的外部包版本
- 利用 npm 生态系统，减少版本管理复杂性

### 1.3 导入解析策略

使用标准 Node.js 导入语法，自动解析到外部包：

```tsx
// 标准导入语法
import { Excalidraw } from "@excalidraw/excalidraw"

// 自动解析为: https://esm.sh/@excalidraw/excalidraw
```

## 2. 内置组件库集成

### 2.1 Shadcn/ui 集成

提供与 Shadcn/ui 组件的无缝集成，实现与 Eidos 界面一致的 UI 样式：

```tsx
import { Button } from "@/components/ui/button"
```

组件与主应用程序共享主题配置，同时支持独立的主题自定义。

### 2.2 AI 辅助开发

Shadcn/ui 的 LLM 友好架构促进了 AI 辅助开发，在简单场景下无需手动编码即可生成代码。

## 3. 运行时环境

Block 组件在标准 React 组件的浏览器环境中执行。在 Eidos Desktop 中，每个 Block 都在独立域中运行：

```
<extid>.block.<spaceId>.eidos.localhost:13127
```

## 4. 扩展类型和规范

### 4.1 表格视图扩展

提供超出默认网格、画廊和看板视图的自定义可视化选项。

#### 元配置

```typescript
interface TableViewMeta {
  type: "tableView"
  componentName: string
  tableView: {
    title: string
    type: string // 内置类型: grid, gallery, kanban
    description: string
  }
}
```

#### 数据存储

自定义扩展视图类型信息存储在 `eidos__views` 表中，采用 `ext__<type>` 格式：

- 内置视图：`grid`、`gallery`、`kanban`
- 自定义扩展：`ext__list`、`ext__timeline`、`ext__chart` 等

#### URL 访问模式

当作为表格视图扩展渲染时，块将访问以下 URL 结构：

```
<extid>.block.<spaceId>.eidos.localhost:13127/<tableid>/<viewid>
```

#### 实现示例

```tsx
export const meta = {
  type: "tableView",
  componentName: "MyListView",
  tableView: {
    title: "列表视图",
    type: "list",
    description: "这是一个列表视图",
  },
}

export function MyListView() {
  const [rows, setRows] = useState<any[]>([])

  // 从 URL 中获取 tableId 和 viewId
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

### 4.2 扩展节点类型

提供超出默认文档和表格节点的自定义节点类型，具有一致的目录树行为但自定义渲染逻辑。

#### URL 访问模式

```
<extid>.block.<spaceId>.eidos.localhost:13127/<nodeid>
```

#### 元配置

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

#### 实现示例

**客户端数据检索（仅本地）：**

```tsx
export const meta = {
  type: "extNode",
  componentName: "MyExcalidraw",
  extNode: {
    title: "Excalidraw",
    description: "这是一个 excalidraw 节点",
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

**服务端数据检索（可发布）：**

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

### 4.3 默认组件覆盖

支持覆盖默认组件，例如用替代实现替换默认的基于 Lexical 的文档编辑器：

```tsx
import Editor from "@monaco-editor/react"

export const meta = {
  type: "document",
  componentName: "MyDocument",
}

export function MyDocument() {
  if (ctx.type !== "document") {
    return <div>不是文档</div>
  }
  return <Editor />
}
```

## 5. 安全注意事项

扩展执行应该被适当沙箱化，防止未经授权的系统访问。实现必须验证组件属性，并在扩展和主机应用程序之间强制执行适当的隔离。

## 6. 实现要求

- 需要特定扩展功能时，应导出符合指定接口的 `meta` 对象
- 不导出 `meta` 对象时，组件作为普通 React 组件运行
- 导出 `meta` 对象时，`meta.componentName` 必须与实际导出的组件匹配
- 应实现适当的错误边界和加载状态
- 与应用程序数据交互时，必须通过 Eidos SDK 执行

## 7. 未来扩展

本规范可能会扩展以支持其他扩展类型，如自定义字段渲染器等。

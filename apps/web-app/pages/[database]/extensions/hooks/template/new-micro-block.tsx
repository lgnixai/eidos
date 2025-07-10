import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export const meta = {
  type: "tableView",
  componentName: "MyListView",
  tableView: {
    title: "List View",
    type: "list",
    description: "This is a list view",
  },
}

function MyButton() {
  // tailwind css support
  return <button className="bg-red-300 p-2 rounded-md">I'm a button</button>
}

const getRows = async (ctx) => {
  const rows = await eidos.currentSpace.table(ctx.tableId).rows.query(
    {},
    {
      viewId: ctx.viewId,
    }
  )
  return rows
}

export function MyListView({ ctx }) {
  const [rows, setRows] = useState([])
  const [treeNodes, setTreeNodes] = useState([])

  useEffect(() => {
    getRows(ctx).then((rows) => {
      setRows(rows)
    })
  }, [ctx])

  const handleClick = async () => {
    const res = await eidos.currentSpace.tree.list({ is_deleted: false })
    setTreeNodes(res)
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <h1>Welcome to my table view</h1>
      <MyButton />
      {/* shadcn component support */}
      <Button onClick={handleClick}>get nodes</Button>
      <hr />
      <div>
        <h2>Table Rows:</h2>
        {rows.map((row) => (
          <div key={row.id}>{row.title || "Untitled Row"}</div>
        ))}
      </div>
      <hr />
      <div>
        <h2>Tree Nodes:</h2>
        {treeNodes.map((node) => (
          <div key={node.id}>{node.name || "Untitled"}</div>
        ))}
      </div>
    </div>
  )
}

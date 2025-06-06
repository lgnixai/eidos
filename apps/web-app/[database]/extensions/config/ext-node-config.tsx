import { useState } from "react"
import { IExtension } from "@/packages/core/meta-table/extension"
import { useLoaderData, useRevalidator } from "react-router-dom"

import { useAllMblocks } from "@/hooks/use-all-mblocks"
import { useExtension } from "@/hooks/use-extension"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export const ExtNodeConfig = () => {
  const extNode = useLoaderData() as IExtension

  const [nodeType, setNodeType] = useState(extNode.ext_node_type || "")
  const [handleBlockId, setHandleBlockId] = useState(
    extNode.ext_node_handle_block_id || ""
  )

  const revalidator = useRevalidator()
  const { toast } = useToast()
  const { updateExtension } = useExtension()
  const { mblocks, loading } = useAllMblocks()

  const hasChanges = () => {
    return (
      nodeType !== (extNode.ext_node_type || "") ||
      handleBlockId !== (extNode.ext_node_handle_block_id || "")
    )
  }

  const resetForm = () => {
    setNodeType(extNode.ext_node_type || "")
    setHandleBlockId(extNode.ext_node_handle_block_id || "")
  }

  const handleUpdate = async () => {
    try {
      await updateExtension({
        id: extNode.id,
        ext_node_type: nodeType,
        ext_node_handle_block_id: handleBlockId,
      })
      revalidator.revalidate()
      toast({ title: "ExtNode Updated Successfully" })
    } catch (error) {
      toast({
        title: "Failed to update ExtNode",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>ExtNode Configuration</CardTitle>
            <CardDescription>
              Configure the node type and handle block ID for this extension
            </CardDescription>
          </div>{" "}
          {hasChanges() && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Unsaved changes</p>
              <Button
                variant="outline"
                size="xs"
                onClick={resetForm}
                disabled={!hasChanges()}
              >
                Cancel
              </Button>
              <Button size="xs" onClick={handleUpdate} disabled={!hasChanges()}>
                Update
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="nodeType" className="text-sm font-medium">
              Node Type
            </Label>
            <Input
              id="nodeType"
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value.toLowerCase())}
              placeholder="Enter node type"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="handleBlockId" className="text-sm font-medium">
              Handle Block ID
            </Label>
            <Select
              value={handleBlockId}
              onValueChange={setHandleBlockId}
              disabled={loading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a micro block" />
              </SelectTrigger>
              <SelectContent>
                {mblocks.map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    {block.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

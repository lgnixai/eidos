import { useParams } from "react-router-dom"

import { BlockApp } from "@/components/block-renderer/block-app"

export const BlocksPage = () => {
  const { database, blockId } = useParams()
  if (!blockId) {
    return <div>Block not found</div>
  }
  return <BlockApp url={`block://${blockId}@${database}`} height={"100%"} />
}

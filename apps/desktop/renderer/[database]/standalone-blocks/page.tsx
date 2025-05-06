import { useEffect, useRef } from "react"
import { useSize } from "ahooks"
import { useParams, useSearchParams } from "react-router-dom"

import { useMblock } from "@/hooks/use-mblock"
import { BlockApp } from "@/components/block-renderer/block-app"

export default function BlockPage() {
  const { id, database } = useParams()
  const [searchParams] = useSearchParams()

  const containerRef = useRef<HTMLDivElement>(null)
  const size = useSize(containerRef)
  const block = useMblock(id)
  useEffect(() => {
    if (block) {
      // set title
      document.title = `Eidos - ${block.name}`
    }
  }, [block])
  return (
    <div className="h-full w-full" ref={containerRef}>
      <BlockApp
        url={`block://${id}@${database}?${searchParams.toString()}`}
        height={size?.height}
      />
    </div>
  )
}

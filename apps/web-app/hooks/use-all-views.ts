import { useState } from "react"
import { useEffect } from "react"
import { useSqlite } from "./use-sqlite"
import type { IView } from "@/packages/core/types/IView"

export const useAllViews = ({ tableId }: { tableId: string }) => {
    const [views, setViews] = useState<IView[]>([])
    const { sqlite } = useSqlite()

    useEffect(() => {
        if (!sqlite) return
        sqlite.listViews(tableId).then((views) => {
            setViews(views)
        })
    }, [sqlite])

    return views
}

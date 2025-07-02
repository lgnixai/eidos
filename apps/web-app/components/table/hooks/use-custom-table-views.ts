import { useSqlite } from "@/hooks/use-sqlite"
import type { IExtension, TableViewInfo } from "@/packages/core/types/IExtension"
import { useEffect } from "react"
import { useState } from "react"


export const useTableViewInfoByExtType = (type?: string) => {
    const { sqlite } = useSqlite()
    const [tableViews, setTableViews] = useState<IExtension[]>([])
    useEffect(() => {
        if (!type?.startsWith("ext__")) {
            return
        }
        const fetchTableViews = async () => {
            const tableViews = await sqlite?.extension.getTableViewExtensionInfoByExtType(type.split("__")[1])
            setTableViews(tableViews || [])
        }
        fetchTableViews()
    }, [sqlite, type])
    return tableViews[0] || null
}

export const useCustomTableViews = () => {
    const [tableViews, setTableViews] = useState<TableViewInfo[]>([])
    const { sqlite } = useSqlite()

    useEffect(() => {
        const fetchTableViews = async () => {
            const tableViews = await sqlite?.extension.getTableViewsInfo()
            setTableViews(tableViews || [])
        }
        fetchTableViews()
    }, [sqlite])

    return { tableViews }
}
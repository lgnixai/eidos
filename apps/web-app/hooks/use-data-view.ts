import { useCallback, useEffect, useState } from "react"
import { useSqlite } from "./use-sqlite"

export const useDataView = () => {
    const { sqlite } = useSqlite()

    const createDataView = async (id: string, createViewSql: string) => {
        await sqlite?.dataView.createDataView(id, createViewSql)
    }

    const isDataViewExist = async (id: string) => {
        return await sqlite?.dataView.isDataViewExist(id)
    }

    const getViewColumns = async (id: string) => {
        return await sqlite?.dataView.getViewColumns(id)
    }

    return {
        createDataView,
        isDataViewExist,
        getViewColumns
    }
}

export const useDataViewById = (id?: string) => {
    const [isDataViewExist, setIsDataViewExist] = useState(false)
    const [viewColumns, setViewColumns] = useState<any[]>([])
    const { sqlite } = useSqlite()

    const reload = useCallback(() => {
        if (id) {
            sqlite?.dataView.isDataViewExist(id).then(setIsDataViewExist)
            sqlite?.dataView.getViewColumns(id).then(setViewColumns)
        }
    }, [id])
    // console.log("viewColumns", { id, viewColumns })
    useEffect(() => {
        reload()
    }, [id, reload])

    return {
        isDataViewExist,
        viewColumns,
        reload
    }
}

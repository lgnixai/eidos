import { useTableSearchStore } from "@/components/table/hooks/use-table-search-store";
import { Item } from "@glideapps/glide-data-grid";
import { useEffect, useMemo, useState } from "react";

interface FormattedResult {
    columnIndex: number;
    rowIndex: number;
    rowId: string;
}

export const useSearchResults = (
    getColumnIndexByColumnName: (fieldName: string) => number,
) => {
    const { searchResults, currentSearchIndex } = useTableSearchStore()
    const [formattedResults, setFormattedResults] = useState<FormattedResult[]>([])

    useEffect(() => {
        if (!searchResults) {
            setFormattedResults([])
            return
        }
        const formattedResults = searchResults.flatMap((result) => {
            return result.matches.map((match) => {
                return {
                    columnIndex: getColumnIndexByColumnName(match.column),
                    rowIndex: result.rowIndex,
                    rowId: result.row._id
                } as FormattedResult
            })
        })
        setFormattedResults(formattedResults)
    }, [searchResults])

    const formattedSearchResults = useMemo(() => {
        return formattedResults.map(result => ([result.columnIndex, result.rowIndex] as Item))
    }, [formattedResults])

    // console.log({ formattedResults, formattedSearchResults, currentSearchIndex, searchResults })

    return {
        searchResults,
        formattedSearchResults,
        isLoadingComplete: !searchResults || currentSearchIndex >= formattedResults.length,
        currentSearchIndex,
    }
}
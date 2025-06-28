import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql"
import monokai from "react-syntax-highlighter/dist/esm/styles/hljs/monokai"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

SyntaxHighlighter.registerLanguage("sql", sql)

interface SQLQueryDisplayProps {
  query: string
  fieldMappings?: Record<string, string>
}

export const SQLQueryDisplay: React.FC<SQLQueryDisplayProps> = ({
  query,
  fieldMappings = {},
}) => {
  const { t } = useTranslation()
  const [showOriginal, setShowOriginal] = useState(false)

  const hasMapping = Object.keys(fieldMappings).length > 0
  const transformQuery = (originalQuery: string): string => {
    if (showOriginal) {
      return originalQuery
    }

    let transformedQuery = originalQuery

    // Replace fields starting with cl_ and wrap display names with double quotes
    Object.entries(fieldMappings).forEach(([original, display]) => {
      const regex = new RegExp(original, "g")
      transformedQuery = transformedQuery.replace(regex, `"${display}"`)
    })

    return transformedQuery
  }

  return (
    <div className="sql-query-display relative flex-1">
      {hasMapping && (
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <Label
            htmlFor="show-original"
            className="text-sm text-muted-foreground"
          >
            {showOriginal ? "Original Column Names" : "Display Field Names"}
          </Label>
          <Switch
            id="show-original"
            checked={showOriginal}
            onCheckedChange={setShowOriginal}
          />
        </div>
      )}
      <SyntaxHighlighter
        language="sql"
        style={monokai}
        customStyle={{
          padding: "1rem",
          borderRadius: "4px",
          fontSize: "14px",
          lineHeight: "1.5",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          paddingTop: "2rem",
        }}
        wrapLines
        wrapLongLines
      >
        {transformQuery(query)}
      </SyntaxHighlighter>
    </div>
  )
}

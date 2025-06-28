import { Badge } from "./ui/badge"

export const ExtNodeBadge = ({ type }: { type: string }) => {
  if (!type.startsWith("ext__")) return null
  return (
    <Badge variant="outline" className="text-xs ml-2">
      {type.split("ext__")[1]}
    </Badge>
  )
}

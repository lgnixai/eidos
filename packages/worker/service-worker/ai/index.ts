// import { handleGoogleAI } from "./google"
import { DataSpace } from "@/packages/core/DataSpace"
import { IData } from "./interface"
import { handleChatApi } from "./chat-api"

export const pathname = "/api/chat"
export default async function handle(event: FetchEvent, ctx?: {
  getDataspace: (space: string) => Promise<DataSpace | null>
}) {
  const data = (await event.request.json()) as IData
  return handleChatApi(data, ctx)
}

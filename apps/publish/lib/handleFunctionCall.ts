import { MsgType } from "@/lib/const"

export interface IHttpSendData {
    type: MsgType.CallFunction
    data: {
        method: string
        params: any[]
        dbName: string
        tableId?: string
        userId?: string
    }
    id: string
}

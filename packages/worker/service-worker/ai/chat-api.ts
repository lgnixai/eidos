import { getProvider } from "@/lib/ai/helper";
import { CoreUserMessage, LanguageModelV1, Tool, convertToCoreMessages, createDataStreamResponse, extractReasoningMiddleware, jsonSchema, smoothStream, streamText, wrapLanguageModel } from "ai";


// import { queryEmbedding } from "../routes/lib"
import { isDesktopMode } from "@/lib/env";
import { uuidv7 } from "@/lib/utils";
import { DataSpace } from "@/worker/web-worker/DataSpace";
import { ChatMessage } from "@/worker/web-worker/meta-table/message";
import { generateTitleFromUserMessage, getChatById, getChatMessages, getLastAssistantMessage, getMostRecentUserMessage, isReloadScenario, saveChat, saveMessages, updateChatTitle, updateMessage } from "./helper";
import { IData } from "./interface";




/**
 * handle chat api for frontend, use with `useChat` hook in ai sdk
 * @param data 
 * @param ctx 
 * @returns 
 */
export async function handleChatApi(
  data: IData,
  ctx?: {
    getDataspace: (space: string) => Promise<DataSpace | null>
  }
) {
  // only use functions on desktop app
  let useFunctions = isDesktopMode
  const {
    messages,
    apiKey,
    baseUrl,
    systemPrompt,
    model: modelAndProvider,
    // currentPreviewFile,
    space,
    id,
    projectId,
    textModel,
    tools,
    chunking = 'line'
  } = data

  // now tools defined in `tools` field will be used, It comes from `useChat` hook in ai sdk
  const _tools: Record<string, Tool> = {}

  Object.entries(tools ?? {}).forEach(([key, value]) => {
    _tools[key] = {
      parameters: jsonSchema(value?.parameters as object),
    }
  })

  const model = modelAndProvider.split("@")[0]
  const provider = getProvider({
    apiKey,
    baseUrl,
    type: data.type
  })

  const lastMsg = messages[messages.length - 1]
  let newMsgs = messages
  if (systemPrompt?.length) {
    newMsgs = [
      {
        id: "system",
        role: "system" as const,
        content: systemPrompt,
      },
      ...messages,
    ]
  }

  const coreMessages = convertToCoreMessages(newMsgs);
  const userMessage = getMostRecentUserMessage(coreMessages);
  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const dataspace = space && await ctx?.getDataspace(space)

  const llmodelForTextTask = textModel && getProvider({
    apiKey: textModel.apiKey,
    baseUrl: textModel.baseUrl,
    type: textModel.type
  })(textModel.modelId.split("@")[0]) as LanguageModelV1

  const llmodel = provider(model ?? "gpt-3.5-turbo-0125") as LanguageModelV1
  let isReload = false
  let lastAssistantMessageId = ""
  if (dataspace) {
    const chat = await getChatById(id, dataspace);
    const getTitle = () => {
      if (llmodelForTextTask) {
        try {
          return generateTitleFromUserMessage({ message: userMessage as CoreUserMessage, model: llmodelForTextTask })
        } catch (error) {
          console.error("Failed to generate title", error)
          return 'error generating title'
        }
      }
      return 'untitle'
    }
    console.log("userMessage", {
      userMessage,
      space,
      id,
      chat,
    })
    if (!chat) {
      const title = await getTitle();
      await saveChat({ id, projectId, title }, dataspace);
    }
    if (!chat?.title) {
      const title = await getTitle();
      await updateChatTitle(id, title, dataspace);
    }

    // Check if this is a reload scenario
    isReload = await isReloadScenario(messages as ChatMessage[], dataspace, id);
    console.log('Is reload scenario:', isReload);
    // Only save user message if it's not a reload
    if (!isReload) {
      await saveMessages({
        messages: [
          { ...userMessage, id: uuidv7(), chat_id: id } as ChatMessage,
        ],
      }, dataspace);
    }
  }


  // immediately start streaming (solves RAG issues with status, etc.)
  return createDataStreamResponse({
    execute: dataStream => {
      dataStream.writeData('initialized call');
      let request: Parameters<typeof streamText>[0] = {
        model: wrapLanguageModel({
          model: llmodel,
          middleware: extractReasoningMiddleware({ tagName: 'think' })
        }),
        experimental_transform: smoothStream({
          delayInMs: 20,
          chunking
        }),
        messages: coreMessages,
        onFinish: async ({ text }) => {
          try {
            if (dataspace) {
              if (isReload) {
                const lastAssistantMessage = await getLastAssistantMessage(id, dataspace)
                await updateMessage({
                  id: lastAssistantMessage.id,
                  chat_id: id,
                  role: "assistant",
                  content: text,
                }, dataspace);
              } else {
                await saveMessages({
                  messages: [{
                    id: uuidv7(),
                    chat_id: id,
                    role: "assistant",
                    content: text,
                  }],
                }, dataspace);
              }

            }
          } catch (error) {
            console.error('Failed to save chat');
          }
        },
      }
      if (useFunctions) {
        request = {
          ...request,
          tools: _tools,
          toolChoice: "auto",
        }
      }
      const result = streamText(request)
      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true
      });
    },

    onError: error => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },
  });

}

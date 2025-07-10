import { createOpenAI } from "@ai-sdk/openai"
import { generateText as _generateText } from "ai"

export const generateText = async ({
  prompt,
  modelId,
  systemPrompt,
  config,
}: {
  prompt: string
  systemPrompt?: string
  modelId: string
  config: {
    apiKey: string
    baseURL: string
  }
}) => {
  const openai = createOpenAI(config)
  const model = openai(modelId)
  const res = await _generateText({
    model,
    messages: [{ role: "user", content: prompt }],
    system: systemPrompt,
  })
  return res.text
}



export const applyCode = async ({
  originalCode,
  updateSnippet,
}: {
  originalCode: string
  updateSnippet: string
}) => {
  const openai = createOpenAI({
    apiKey: 'sk-cixKQTIh5HTyb2iBfdga0HZ9-wPbRp1GeUKzW16XDpWrdN4_',
    baseURL: 'https://api.morphllm.com/v1',
    // headers: {
    //   "HTTP-Referer": "https://eidos.space",
    //   "X-Title": "Eidos",
    // }
  })
  const model = openai("auto")
  const res = await _generateText({
    model,
    messages: [{ role: "user", content: `<code>${originalCode}</code><update>${updateSnippet}</update>` }],

  })
  return res.text
}
const OPENAI_API_URL = "https://api.openai.com/v1/responses"

export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY || null
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini"

  return {
    apiKey,
    model,
    configured: Boolean(apiKey)
  }
}

export async function createOpenAIResponse(body: Record<string, unknown>) {
  const config = getOpenAIConfig()

  if (!config.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      ...body
    })
  })

  const data = await response.json()

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      "OpenAI request failed"

    throw new Error(message)
  }

  return data
}

export function extractOpenAIText(response: any) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text
  }

  const content = response?.output?.flatMap((item: any) => item?.content || []) || []
  const textPart = content.find((part: any) => typeof part?.text === "string" && part.text.trim())

  return textPart?.text || ""
}

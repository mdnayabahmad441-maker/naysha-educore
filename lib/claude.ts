import Anthropic from "@anthropic-ai/sdk"

export function getClaudeConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY || null
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-6"
  return { apiKey, model, configured: Boolean(apiKey) }
}

function getClient(): Anthropic {
  const { apiKey } = getClaudeConfig()
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured")
  return new Anthropic({ apiKey })
}

type ClaudeMessage = {
  role: "user" | "assistant"
  content: string | Anthropic.ContentBlockParam[]
}

type CreateClaudeParams = {
  system?: string
  messages: ClaudeMessage[]
  maxTokens?: number
  tools?: Anthropic.Tool[]
  toolChoice?: Anthropic.ToolChoice
}

export async function createClaudeMessage(params: CreateClaudeParams) {
  const { model } = getClaudeConfig()
  const client = getClient()

  const body: Anthropic.MessageCreateParamsNonStreaming = {
    model,
    max_tokens: params.maxTokens ?? 2048,
    messages: params.messages
  }

  if (params.system) body.system = params.system
  if (params.tools) body.tools = params.tools
  if (params.toolChoice) body.tool_choice = params.toolChoice

  return client.messages.create(body)
}

export function extractClaudeText(response: Anthropic.Message): string {
  const block = response.content.find((c) => c.type === "text")
  return block && block.type === "text" ? block.text : ""
}

export function extractClaudeToolInput(response: Anthropic.Message): Record<string, unknown> | null {
  const block = response.content.find((c) => c.type === "tool_use")
  return block && block.type === "tool_use" ? (block.input as Record<string, unknown>) : null
}

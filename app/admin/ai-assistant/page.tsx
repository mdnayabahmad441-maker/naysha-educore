"use client"

import { useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { getSchoolId } from "@/lib/school"
import { useSchool } from "@/context/SchoolContext"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const quickPrompts = [
  "Draft a fee reminder notice for all parents.",
  "Write a polite reply for a new admission enquiry.",
  "Create a checklist for monthly school admin work.",
  "Suggest a parent message for low attendance."
]

export default function AdminAiAssistantPage() {
  const school = useSchool()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me to draft notices, reply to admission enquiries, write parent communication, or help with ERP operations."
    }
  ])
  const [prompt, setPrompt] = useState("")
  const [sending, setSending] = useState(false)

  const sendMessage = async (seed?: string) => {
    const content = (seed || prompt).trim()
    if (!content) return

    setSending(true)
    const schoolId = await getSchoolId()
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }]
    setMessages(nextMessages)
    setPrompt("")

    try {
      const response = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          schoolId,
          schoolName: school?.name || "School",
          messages: nextMessages
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Failed to get AI reply")
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.message || "I could not generate a response."
        }
      ])
    } catch (error) {
      console.error(error)
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Failed to get AI reply"
        }
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-white md:p-10">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Use AI inside the ERP to draft school communication, operations text, and admin replies faster.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Quick Prompts</p>
          {quickPrompts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => void sendMessage(item)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/10"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <div className="space-y-4">
            <div className="max-h-[60vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#08111f] p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    message.role === "assistant"
                      ? "mr-8 bg-white/6 text-gray-100"
                      : "ml-8 bg-blue-600/20 text-blue-100"
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {message.role === "assistant" ? "AI Assistant" : "You"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask AI to draft notices, parent messages, replies, workflows, or admin content..."
                className="h-32 w-full rounded-2xl border border-white/10 bg-[#0b1220] p-4 text-white"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {sending ? "Thinking..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

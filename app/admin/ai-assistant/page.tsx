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
  "How many students are enrolled and how is today's attendance?",
  "Give me a fee collection summary — total collected and pending.",
  "How many admission enquiries are pending?",
  "Draft a fee reminder notice for parents with unpaid fees.",
  "Write a polite reply for a new admission enquiry.",
  "Suggest a parent WhatsApp message for low attendance.",
]

export default function AdminAiAssistantPage() {
  const school = useSchool()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I have live access to your school's data. Ask me about students, attendance, fees, pending enquiries, or get me to draft notices and parent messages.",
    },
  ])
  const [prompt, setPrompt] = useState("")
  const [sending, setSending] = useState(false)

  const sendMessage = async (seed?: string) => {
    const content = (seed || prompt).trim()
    if (!content || sending) return

    setSending(true)
    const schoolId = await getSchoolId()
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }]
    setMessages(nextMessages)
    setPrompt("")

    try {
      const response = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          schoolName: school?.name || "School",
          messages: nextMessages,
        }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result?.error || "Failed to get AI reply")

      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: result.message || "I could not generate a response." },
      ])
    } catch (error) {
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: error instanceof Error ? error.message : "Failed to get AI reply" },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-white md:p-10">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-400">
          Powered by live school data. Ask about reports, fees, attendance, or get AI to draft notices and messages.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">

        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Quick ask</p>
          {quickPrompts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => void sendMessage(item)}
              disabled={sending}
              className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-left text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">

          <div className="flex max-h-[62vh] min-h-[300px] flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-[#08111f] p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "assistant"
                    ? "mr-10 bg-white/5 text-gray-100"
                    : "ml-10 bg-blue-600/20 text-blue-100"
                }`}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  {msg.role === "assistant" ? "✦ AI" : "You"}
                </p>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {sending && (
              <div className="mr-10 rounded-xl bg-white/5 px-4 py-3 text-sm text-gray-400">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500">✦ AI</p>
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your school… (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-[#0b1220] p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={sending || !prompt.trim()}
              className="self-end rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

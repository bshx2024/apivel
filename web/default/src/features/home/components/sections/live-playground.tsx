/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  RefreshCw,
  Sparkles,
  Send,
  User,
  Bot,
  Gift,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { Markdown } from '@/components/ui/markdown'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'sending' | 'streaming' | 'done' | 'error'
}

export type DemoModelId = 'deepseek-v4.1-flash' | 'qwen3.8-flash' | 'glm-5.3-flash'

interface DemoModelOption {
  id: DemoModelId
  name: string
  tag: string
  speed: string
  welcomeContent: string
}

export interface LivePlaygroundProps {
  className?: string
  defaultModel?: DemoModelId
  redirectSource?: string
}

export function LivePlayground({
  className,
  defaultModel = 'deepseek-v4.1-flash',
  redirectSource,
}: LivePlaygroundProps) {
  const { t } = useTranslation()

  const DEMO_MODELS: DemoModelOption[] = [
    {
      id: 'deepseek-v4.1-flash',
      name: 'DeepSeek Flash',
      tag: 'V4.1 Vision',
      speed: '⚡ 437 t/s',
      welcomeContent: t(
        '⚡ **APIVEL Live Speed Benchmark (Zero Login Required)**\n\n• **Model**: `deepseek-v4.1-flash` (Native Multimodal Vision + 437 tok/s)\n• **Server**: Global CDN Relay · Average TTFT Latency: **~320ms**\n\n👇 **Pick a benchmark challenge below or type any code prompt to test real-time streaming:**'
      ),
    },
    {
      id: 'qwen3.8-flash',
      name: 'Qwen 3.8 Flash',
      tag: 'Alibaba Cloud',
      speed: '⚡ 380 t/s',
      welcomeContent: t(
        '⚡ **APIVEL Live Speed Benchmark (Zero Login Required)**\n\n• **Model**: `qwen3.8-flash` (Alibaba High-Throughput Architecture)\n• **Server**: Global CDN Relay · Average TTFT Latency: **~350ms**\n\n👇 **Pick a benchmark challenge below or type any code prompt to test real-time streaming:**'
      ),
    },
    {
      id: 'glm-5.3-flash',
      name: 'GLM-5.3 Flash',
      tag: 'Zhipu AI',
      speed: '⚡ 420 t/s',
      welcomeContent: t(
        '⚡ **APIVEL Live Speed Benchmark (Zero Login Required)**\n\n• **Model**: `glm-5.3-flash` (Next-Gen Coding Agentic Architecture)\n• **Server**: Global CDN Relay · Average TTFT Latency: **~310ms**\n\n👇 **Pick a benchmark challenge below or type any code prompt to test real-time streaming:**'
      ),
    },
  ]

  const [selectedModel, setSelectedModel] = useState<DemoModelId>(defaultModel)
  const [promptInput, setPromptInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [remainingCalls, setRemainingCalls] = useState(5)

  const chatContainerRef = useRef<HTMLDivElement>(null)

  const activeModelMeta =
    DEMO_MODELS.find((m) => m.id === selectedModel) || DEMO_MODELS[0]

  // Initial welcome message and calls count
  useEffect(() => {
    const saved = localStorage.getItem('playground_remaining_calls')
    if (saved !== null) {
      setRemainingCalls(parseInt(saved, 10))
    } else {
      localStorage.setItem('playground_remaining_calls', '5')
    }

    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: activeModelMeta.welcomeContent,
        status: 'done',
      },
    ])
  }, [selectedModel])

  // Auto scroll internal chat container only
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isGenerating])

  const handleModelSwitch = (modelId: DemoModelId) => {
    if (isGenerating || modelId === selectedModel) return
    setSelectedModel(modelId)
    setPromptInput('')
  }

  // Send message in ChatGPT-style playground
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || promptInput).trim()
    if (!query || isGenerating) return

    const savedCalls = localStorage.getItem('playground_remaining_calls')
    const currentCalls = savedCalls !== null ? parseInt(savedCalls, 10) : 5

    if (currentCalls <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: query,
        },
        {
          id: `system-limit-${Date.now()}`,
          role: 'assistant',
          content: t(
            '⚠️ **You have completed your 5 free trial queries!**\n\nTo ensure consistent high-quality service, guest queries are limited to 5. Sign up for a free account with no card required to receive **100,000 API Tokens** and access 40+ premier LLMs globally!'
          ),
          status: 'error',
        },
      ])
      setPromptInput('')
      return
    }

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `assistant-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: query },
      { id: assistantMsgId, role: 'assistant', content: '', status: 'streaming' },
    ])
    setPromptInput('')
    setIsGenerating(true)

    try {
      const response = await fetch('/api/playground/public/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          stream_options: { include_usage: true },
          messages: [{ role: 'user', content: query }],
          stream: true,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const errMsg =
          errData?.error?.message ||
          t('Request failed (HTTP {{status}}). Upstream channel is busy, please try again.', { status: response.status })
        throw new Error(errMsg)
      }

      // Decrement remaining calls
      const nextCalls = Math.max(0, currentCalls - 1)
      setRemainingCalls(nextCalls)
      localStorage.setItem('playground_remaining_calls', String(nextCalls))

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder('utf-8')
      let done = false
      let buffer = ''

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          buffer += decoder.decode(value, { stream: !done })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const cleanLine = line.trim()
            if (!cleanLine) continue
            if (cleanLine.startsWith('data: ')) {
              const dataStr = cleanLine.slice(6)
              if (dataStr === '[DONE]') continue
              try {
                const parsed = JSON.parse(dataStr)
                const contentDelta = parsed.choices?.[0]?.delta?.content || ''
                if (contentDelta) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: msg.content + contentDelta }
                        : msg
                    )
                  )
                }
              } catch (e) {
                // Ignore chunk parse errors
              }
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, status: 'done' } : msg
        )
      )
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  msg.content ||
                  t('❌ Service error: {{error}}', { error: err.message || String(err) }),
                status: 'error',
              }
            : msg
        )
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleResetChat = () => {
    setRemainingCalls(5)
    localStorage.setItem('playground_remaining_calls', '5')
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: activeModelMeta.welcomeContent,
        status: 'done',
      },
    ])
    setPromptInput('')
  }

  const quickPrompts = [
    t('⚡ 50-line Snake Game in Python with curses'),
    t('⏱️ TTFT Speed Test: Explain Quantum Computing in 20 words'),
    t('🧠 Logic Riddle: 3 cats catch 3 mice in 3 minutes...'),
  ]

  return (
    <div
      className={cn(
        'w-full max-w-4xl mx-auto border border-border/60 bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px] md:h-[520px] relative text-left',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/50 bg-muted/40 px-3 py-2.5 sm:px-5 gap-2">
        {/* Model Switcher Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center rounded-xl bg-background/80 border border-border/60 p-0.5">
            {DEMO_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => handleModelSwitch(model.id)}
                disabled={isGenerating}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer',
                  selectedModel === model.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span>{model.name}</span>
                <span
                  className={cn(
                    'text-[10px] px-1 py-0.2 rounded-sm font-mono',
                    selectedModel === model.id
                      ? 'bg-white/20 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {model.tag}
                </span>
              </button>
            ))}
          </div>

          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold hidden md:inline-flex items-center gap-1 font-mono">
            {activeModelMeta.speed}
          </span>
        </div>

        {/* Free Calls Badge & Reset */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
            🎁 {t('Free Calls: {{count}}/5', { count: remainingCalls })}
          </span>
          <button
            type="button"
            onClick={handleResetChat}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 p-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={t('Reset Conversation')}
          >
            <RefreshCw className="size-3.5" />
            <span className="hidden sm:inline">{t('Reset')}</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-background/40"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 max-w-3xl',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'size-7 md:size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                msg.role === 'user'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md'
              )}
            >
              {msg.role === 'user' ? (
                <User className="size-3.5" />
              ) : (
                <Bot className="size-3.5" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2.5 text-xs md:text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm max-w-[85%]'
                  : 'bg-muted/60 border border-border/40 text-foreground rounded-tl-xs max-w-[90%] space-y-2'
              )}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose dark:prose-invert text-xs md:text-sm leading-relaxed max-w-none">
                  <Markdown>{msg.content || (isGenerating ? '...' : '')}</Markdown>
                </div>
              )}

              {/* Limit Exceeded Call-to-Action Card */}
              {msg.status === 'error' && remainingCalls <= 0 && (
                <div className="mt-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Gift className="size-4" />
                    <span>{t('Get 100,000 Free API Tokens on Sign-up!')}</span>
                  </div>
                  <p>
                    {t(
                      'Free guest trial limit reached. Sign up with zero credit card required to claim 100,000 tokens ($0.20) for 40+ LLMs.'
                    )}
                  </p>
                  <Link
                    to="/sign-up"
                    search={redirectSource ? { redirect: redirectSource } : undefined}
                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md mt-1 cursor-pointer"
                  >
                    <span>{t('Claim 100,000 Free Tokens Now')}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Post-Benchmark Streaming Conversion Hook */}
        {messages.length >= 3 && !isGenerating && (
          <div className="mx-auto max-w-2xl mt-3 p-3 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2.5 text-left">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="font-bold text-foreground">
                  {t('playground_post_query_hook', '🔥 Impressed by the streaming speed?')}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {t('playground_post_query_sub', 'Use this in Cursor or Claude Code CLI. Sign up in 5s for $0.20 free credit (Zero card required).')}
                </p>
              </div>
            </div>
            <Link
              to="/sign-up"
              search={redirectSource ? { redirect: redirectSource } : undefined}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <span>{t('Claim API Key & $0.20 →')}</span>
            </Link>
          </div>
        )}

        {/* Quick Prompt Tags when starting */}
        {messages.length === 1 && !isGenerating && remainingCalls > 0 && (
          <div className="pt-2 space-y-2 max-w-2xl mx-auto text-center">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Zap className="size-3 text-amber-400" />
              {t('Try suggested benchmark prompts:')}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-xs bg-muted/80 hover:bg-blue-500/10 hover:border-blue-500/40 border border-border/50 text-foreground/80 hover:text-blue-500 px-3 py-1 rounded-full transition-all duration-200 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Chat Input Bar */}
      <div className="border-t border-border/50 bg-card p-3 md:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={promptInput}
            disabled={isGenerating}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={
              remainingCalls > 0
                ? t(
                    'Type your prompt here to test real-time LLM response with zero login...'
                  )
                : t('Trial limit reached. Sign up to claim 100,000 free tokens...')
            }
            className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2 text-xs md:text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50 transition-colors"
          />
          <Button
            type="submit"
            disabled={isGenerating || !promptInput.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3.5 py-2 text-xs font-semibold shrink-0 disabled:opacity-40 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {isGenerating ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

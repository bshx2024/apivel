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
import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Zap,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Terminal,
  Code2,
  CreditCard,
  ArrowRight,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Mail,
  Copy,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/copy-button'
import { Markdown } from '@/components/ui/markdown'

interface InstantTestCardProps {
  apiKey?: string
  baseUrl?: string
  userEmail?: string
  className?: string
}

type ModelChoice = 'deepseek-v4-flash' | 'qwen3.8-flash' | 'glm-5.3-flash'

interface QuickPrompt {
  label: string
  prompt: string
}

export function InstantTestCard({
  apiKey = '',
  baseUrl = '',
  userEmail = '',
  className,
}: InstantTestCardProps) {
  const { t } = useTranslation()
  const [selectedModel, setSelectedModel] = useState<ModelChoice>('deepseek-v4-flash')
  const [inputVal, setInputVal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [ttft, setTtft] = useState<number | null>(null)
  const [speed, setSpeed] = useState<number | null>(null)
  const [hasCompletedSuccess, setHasCompletedSuccess] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const responseBoxRef = useRef<HTMLDivElement>(null)

  const quickPrompts: QuickPrompt[] = [
    {
      label: t('⚡ 测速挑战', '⚡ 测速挑战'),
      prompt: '请用 Python 编写一段快速排序算法，并解释时间复杂度。请保持精炼。',
    },
    {
      label: t('💻 代理测试', '💻 代理测试'),
      prompt: '请用 50 字以内简要介绍你自己的架构亮点和超低延迟特性。',
    },
    {
      label: t('✨ 快速验证', '✨ 快速验证'),
      prompt: 'Hello! Please confirm this API endpoint is responding properly with ultra-low latency.',
    },
  ]

  const effectiveBaseUrl = baseUrl || (typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'https://apivel.com/v1')
  const claudeCodeSnippet = `export ANTHROPIC_BASE_URL="${effectiveBaseUrl}" && export ANTHROPIC_API_KEY="${apiKey || 'sk-YOUR_KEY'}" && claude`
  const cursorSnippet = `Endpoint: ${effectiveBaseUrl}\nAPI Key: ${apiKey || 'sk-YOUR_KEY'}\nModel: ${selectedModel}`
  const pythonSnippet = `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${effectiveBaseUrl}",\n    api_key="${apiKey || 'sk-YOUR_KEY'}"\n)\n\nresponse = client.chat.completions.create(\n    model="${selectedModel}",\n    messages=[{"role": "user", "content": "Hello!"}]\n)\nprint(response.choices[0].message.content)`
  const curlSnippet = `curl ${effectiveBaseUrl}/chat/completions \\\n  -H "Authorization: Bearer ${apiKey || 'sk-YOUR_KEY'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${selectedModel}",\n    "messages": [{"role": "user", "content": "Hello!"}]\n  }'`

  const emailSubject = '【APIVEL】您的 API 密钥与开发环境配置指引'
  const emailBody = `您好！\n\n以下是您在 APIVEL 账户的 API 接入密钥与环境配置：\n\n1. 基础连接参数：\n- API 接口地址 (Base URL): ${effectiveBaseUrl}\n- API 密钥 (API Key): ${apiKey || '(请登录控制台 /keys 复制)'}\n- 推荐测速模型: ${selectedModel}\n\n2. Cursor / VS Code 配置：\n- Base URL: ${effectiveBaseUrl}\n- API Key: ${apiKey || 'sk-YOUR_KEY'}\n- Model: ${selectedModel}\n\n3. Python (OpenAI SDK) 极简代码：\nfrom openai import OpenAI\nclient = OpenAI(base_url="${effectiveBaseUrl}", api_key="${apiKey || 'sk-YOUR_KEY'}")\nres = client.chat.completions.create(model="${selectedModel}", messages=[{"role": "user", "content": "Hello!"}])\nprint(res.choices[0].message.content)\n\n祝您开发顺利！\nAPIVEL 团队`

  const handleEmailSend = () => {
    const mailtoLink = `mailto:${userEmail || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailtoLink, '_blank')
    toast.success(t('已唤起邮件客户端，包含您的专属 API Key 与完整配置！', '已唤起邮件客户端，包含您的专属 API Key 与完整配置！'))
  }

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? inputVal).trim()
    if (!query || isLoading) return

    setInputVal('')
    setIsLoading(true)
    setTtft(null)
    setSpeed(null)
    setHasCompletedSuccess(false)

    const newMsgs: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: query },
      { role: 'assistant', content: '' },
    ]
    setMessages(newMsgs)

    const startTime = performance.now()
    let firstTokenTime: number | null = null
    let totalChars = 0

    abortControllerRef.current = new AbortController()

    try {
      // 优先使用当前用户的 Key 请求真实的 /v1/chat/completions，无 Key 则使用 /pg/chat/completions 浏览器原生 Session 鉴权兜底
      const endpoint = apiKey ? '/v1/chat/completions' : '/pg/chat/completions'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (apiKey) {
        headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: query }],
          stream: true,
          stream_options: { include_usage: true },
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        const msg = errJson?.error?.message || `HTTP ${response.status} Error`
        throw new Error(msg)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No readable stream')

      const decoder = new TextDecoder()
      let streamContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (!firstTokenTime) {
          firstTokenTime = performance.now()
          setTtft(Math.round(firstTokenTime - startTime))
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue
          const dataStr = trimmed.slice(5).trim()
          if (dataStr === '[DONE]') continue

          try {
            const parsed = JSON.parse(dataStr)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            if (delta) {
              streamContent += delta
              totalChars += delta.length
              setMessages([
                { role: 'user', content: query },
                { role: 'assistant', content: streamContent },
              ])
            }
          } catch {
            // ignore partial json
          }
        }
      }

      const endTime = performance.now()
      const durationSec = Math.max(0.1, (endTime - (firstTokenTime || startTime)) / 1000)
      const estimatedTokens = Math.round(totalChars * 0.75)
      setSpeed(Math.round(estimatedTokens / durationSec))
      setHasCompletedSuccess(true)
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        const errorMsg = (err as Error)?.message || 'Request failed'
        setMessages([
          { role: 'user', content: query },
          { role: 'assistant', content: `❌ **测试请求遇到问题:**\n\n${errorMsg}` },
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 滚动到最新内容
  useEffect(() => {
    if (responseBoxRef.current) {
      responseBoxRef.current.scrollTop = responseBoxRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 sm:p-5 shadow-sm transition-all',
        className
      )}
    >
      {/* 顶部微渐变装饰背景 */}
      <div className='pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent blur-3xl' />

      {/* 头部区 */}
      <div className='flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50'>
        <div className='flex items-center gap-2.5'>
          <span className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <Zap className='size-4' />
          </span>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
                {t('⚡ 10秒极速在线测试', '⚡ 10秒极速在线测试')}
              </h3>
              <Badge variant='outline' className='text-[10px] py-0 px-1.5 font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'>
                {t('免配置即测', '免配置即测')}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {t('无需打开命令行，在浏览器即可直接发起真实 API 握手与极速流式验证', '无需打开命令行，在浏览器即可直接发起真实 API 握手与极速流式验证')}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* 模型切换 Pill */}
          <div className='flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/40 text-xs'>
            {(['deepseek-v4-flash', 'qwen3.8-flash', 'glm-5.3-flash'] as ModelChoice[]).map((m) => (
              <button
                key={m}
                type='button'
                onClick={() => setSelectedModel(m)}
                disabled={isLoading}
                className={cn(
                  'rounded-lg px-2 py-1 text-[11px] font-medium transition-all cursor-pointer',
                  selectedModel === m
                    ? 'bg-background text-foreground shadow-xs border border-border/60 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'deepseek-v4-flash' ? '🚀 DeepSeek Flash' : m === 'qwen3.8-flash' ? '⚡ Qwen Flash' : '🧠 GLM Flash'}
              </button>
            ))}
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsExpanded(!isExpanded)}
            className='size-7 p-0 text-muted-foreground'
          >
            {isExpanded ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className='mt-3 flex flex-col gap-3'>
          {/* 预置场景快捷 Pill */}
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-[11px] text-muted-foreground font-medium flex items-center gap-1'>
              <Sparkles className='size-3 text-amber-500' />
              <span>{t('快捷提问:', '快捷提问:')}</span>
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type='button'
                disabled={isLoading}
                onClick={() => handleSend(qp.prompt)}
                className='inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer disabled:opacity-50'
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* 对话输出区域 */}
          {messages.length > 0 && (
            <div
              ref={responseBoxRef}
              className='max-h-60 overflow-y-auto rounded-xl border border-border/60 bg-background/60 p-3 text-xs leading-relaxed space-y-2'
            >
              {messages.map((m, i) => (
                <div key={i} className='flex gap-2.5'>
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md text-[10px]',
                      m.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'
                    )}
                  >
                    {m.role === 'user' ? <User className='size-3' /> : <Bot className='size-3' />}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <div className='font-semibold text-muted-foreground text-[10px] mb-0.5'>
                      {m.role === 'user' ? t('You', '您') : `${selectedModel} (APIVEL Relay)`}
                    </div>
                    <div className='text-foreground prose prose-xs dark:prose-invert max-w-none'>
                      <Markdown content={m.content || (isLoading ? '⚡ 正在极速推理生成中...' : '')} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 延迟与吞吐指示条 */}
          {(ttft !== null || speed !== null) && (
            <div className='flex items-center gap-3 text-[11px] font-mono text-muted-foreground px-1'>
              {ttft !== null && (
                <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold'>
                  <Activity className='size-3' />
                  <span>TTFT 首字延迟: {ttft}ms</span>
                </span>
              )}
              {speed !== null && (
                <span className='flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold'>
                  <Zap className='size-3' />
                  <span>生成速率: ~{speed} tok/s</span>
                </span>
              )}
            </div>
          )}

          {/* 输入框与发送按钮 */}
          <div className='flex gap-2'>
            <input
              type='text'
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={t('输入任意代码或提示词测试 API 响应 (回车发送)...', '输入任意代码或提示词测试 API 响应 (回车发送)...')}
              disabled={isLoading}
              className='flex-1 rounded-xl border border-input bg-background/80 px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs'
            />
            <Button
              size='sm'
              onClick={() => handleSend()}
              disabled={isLoading || !inputVal.trim()}
              className='shrink-0 gap-1.5 px-3 rounded-xl'
            >
              {isLoading ? (
                <span>⚡ 测速中...</span>
              ) : (
                <>
                  <Send className='size-3.5' />
                  <span>{t('发送测试', '发送测试')}</span>
                </>
              )}
            </Button>
          </div>

          {/* 测试成功后的“下一步场景推荐”行动面板 (需求4核心落地) */}
          {hasCompletedSuccess && (
            <div className='mt-2 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 animate-in fade-in slide-in-from-top-2 duration-300'>
              <div className='flex items-center justify-between gap-2 pb-2 border-b border-emerald-500/20'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200'>
                  <CheckCircle2 className='size-4 text-emerald-600 dark:text-emerald-400' />
                  <span>{t('🎉 API 连通性测试通过！接下来无缝接入您的日常工作流：', '🎉 API 连通性测试通过！接下来无缝接入您的日常工作流：')}</span>
                </div>
                <Link
                  to='/playground'
                  className='text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5'
                >
                  <span>{t('进入完整 Playground', '进入完整 Playground')}</span>
                  <ArrowRight className='size-3' />
                </Link>
              </div>

              <div className='mt-2.5 grid gap-2 sm:grid-cols-2'>
                {/* 场景 1: Claude Code CLI */}
                <div className='flex flex-col justify-between rounded-lg border border-border/60 bg-background/80 p-2.5 shadow-2xs'>
                  <div>
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-xs flex items-center gap-1.5 text-primary'>
                        <Terminal className='size-3.5' />
                        <span>Claude Code CLI</span>
                      </span>
                      <CopyButton text={claudeCodeSnippet} size='sm' className='size-6' />
                    </div>
                    <p className='text-[11px] text-muted-foreground mt-1 line-clamp-1'>
                      终端一键配置环境并在当前工程秒级启动
                    </p>
                  </div>
                  <pre className='mt-2 rounded bg-muted/70 p-1.5 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre'>
                    {claudeCodeSnippet}
                  </pre>
                </div>

                {/* 场景 2: Cursor / VS Code IDE */}
                <div className='flex flex-col justify-between rounded-lg border border-border/60 bg-background/80 p-2.5 shadow-2xs'>
                  <div>
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400'>
                        <Code2 className='size-3.5' />
                        <span>Cursor / VS Code</span>
                      </span>
                      <CopyButton text={effectiveBaseUrl} size='sm' className='size-6' />
                    </div>
                    <p className='text-[11px] text-muted-foreground mt-1 line-clamp-1'>
                      设置中填入 OpenAI Base URL 即可享受超低延迟补全
                    </p>
                  </div>
                  <div className='mt-2 flex items-center justify-between rounded bg-muted/70 p-1.5 text-[10px] font-mono text-muted-foreground'>
                    <span className='truncate'>{effectiveBaseUrl}</span>
                    <Badge variant='secondary' className='text-[9px] py-0 px-1 font-normal'>Base URL</Badge>
                  </div>
                </div>

                {/* 场景 3: Python (OpenAI SDK) */}
                <div className='flex flex-col justify-between rounded-lg border border-border/60 bg-background/80 p-2.5 shadow-2xs'>
                  <div>
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400'>
                        <Terminal className='size-3.5' />
                        <span>Python (OpenAI SDK)</span>
                      </span>
                      <CopyButton text={pythonSnippet} size='sm' className='size-6' />
                    </div>
                    <p className='text-[11px] text-muted-foreground mt-1 line-clamp-1'>
                      直接替换原有 API Key 与 Base URL 即可免改造运行
                    </p>
                  </div>
                  <pre className='mt-2 rounded bg-muted/70 p-1.5 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre'>
                    {pythonSnippet}
                  </pre>
                </div>

                {/* 场景 4: cURL 终端命令行 */}
                <div className='flex flex-col justify-between rounded-lg border border-border/60 bg-background/80 p-2.5 shadow-2xs'>
                  <div>
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400'>
                        <Terminal className='size-3.5' />
                        <span>cURL 命令行</span>
                      </span>
                      <CopyButton text={curlSnippet} size='sm' className='size-6' />
                    </div>
                    <p className='text-[11px] text-muted-foreground mt-1 line-clamp-1'>
                      终端复制粘贴直接运行测速
                    </p>
                  </div>
                  <pre className='mt-2 rounded bg-muted/70 p-1.5 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre'>
                    {curlSnippet}
                  </pre>
                </div>
              </div>

              {/* 移动端专属 & 邮件转存便利条 (解决手机端注册用户无法在本地运行的问题) */}
              <div className='mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/90 p-2.5 border border-border/60'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Mail className='size-4 text-blue-500' />
                  <span>
                    {t(
                      '正在使用手机或其它设备？可一键将 API 接入密钥与 Cursor 配置指引发送至注册邮箱',
                      '正在使用手机或其它设备？可一键将 API 接入密钥与 Cursor 配置指引发送至注册邮箱'
                    )}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleEmailSend}
                    className='text-xs gap-1.5 h-7.5 rounded-lg font-medium cursor-pointer'
                  >
                    <Mail className='size-3.5 text-blue-500' />
                    <span>{t('发送配置至邮箱', '发送配置至邮箱')}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

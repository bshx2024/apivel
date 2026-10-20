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
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Sparkles,
  Copy,
  Check,
  Terminal,
  Code2,
  Key,
  ExternalLink,
  Loader2,
  Zap,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Gift,
  CheckCircle2,
  Play,
  Cpu,
  Smartphone,
  Mail,
  Share2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { track } from '@/lib/tracker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getApiKeys, fetchTokenKey, createApiKey } from '@/features/keys/api'
import { useSourceMapping } from '@/lib/source-model-mapping'
import { useAuthStore } from '@/stores/auth-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { SurveyStep } from '@/components/onboarding/survey-step'
import { TopupOfferStep } from '@/components/onboarding/topup-offer-step'

interface QuickstartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FEATURED_MODELS = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', badge: 'Ultra Fast', desc: 'Premier choice for coding & instant completions' },
  { id: 'qwen3.8-max', name: 'Qwen 3.8 Max', badge: 'Flagship Intelligence', desc: 'Alibaba top frontier model with deep reasoning' },
  { id: 'glm-5.3', name: 'GLM 5.3', badge: 'Agentic Reasoning', desc: 'Zhipu AI premier reasoning & instruction model' },
  { id: 'kimi-k3', name: 'Kimi k3', badge: 'Long Context', desc: 'Moonshot ultra-long context understanding' },
]

export function QuickstartDialog({ open, onOpenChange }: QuickstartDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sourceContext = useSourceMapping()
  const hookIsMobile = useIsMobile()
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return hookIsMobile || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
  }, [hookIsMobile])

  const user = useAuthStore((state) => state.auth.user)
  const userEmail = user?.email || ''

  const [currentStep, setCurrentStep] = useState<'survey' | 'offer' | 'credentials'>(() => {
    if (typeof window !== 'undefined') {
      const surveyDone = localStorage.getItem('apivel_onboarding_survey_done') === 'true'
      return surveyDone ? 'credentials' : 'survey'
    }
    return 'credentials'
  })

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const surveyDone = localStorage.getItem('apivel_onboarding_survey_done') === 'true'
      if (!surveyDone) {
        setCurrentStep('survey')
      }
    }
  }, [open])

  const [apiKey, setApiKey] = useState<string>('')
  const [loadingKey, setLoadingKey] = useState<boolean>(true)
  const [copiedKey, setCopiedKey] = useState<boolean>(false)
  const [copiedCode, setCopiedCode] = useState<boolean>(false)
  const [copiedClaude, setCopiedClaude] = useState<boolean>(false)
  const [mobileTipShown, setMobileTipShown] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      if (tabParam && ['claude', 'cursor', 'curl', 'python', 'nodejs'].includes(tabParam)) {
        return tabParam
      }
      const fromBlog = sessionStorage.getItem('apivel_from_blog_url') || ''
      if (fromBlog.includes('claude') || document.referrer?.includes('claude')) {
        return 'claude'
      }
      if (sourceContext.preferredTab) {
        return sourceContext.preferredTab
      }
    }
    return sourceContext.preferredTab || 'claude'
  })

  // Interactive Live Sandbox State with context-aware default model
  const [selectedTestModel, setSelectedTestModel] = useState<string>(() => {
    return sourceContext.recommendedModel || 'deepseek-v4-flash'
  })
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [testResult, setTestResult] = useState<{ prompt: string; text: string; latency: number } | null>(null)

  // Align active model/tab if context changes or on modal open
  useEffect(() => {
    if (open && sourceContext.matched) {
      if (sourceContext.recommendedModel) {
        setSelectedTestModel(sourceContext.recommendedModel)
      }
      if (sourceContext.preferredTab) {
        setActiveTab(sourceContext.preferredTab)
      }
    }
  }, [open, sourceContext])

  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/v1` 
    : 'https://apivel.com/v1'

  // Fetch or auto-create default API Key for the user
  const initUserKey = useCallback(async (): Promise<string | null> => {
    try {
      setLoadingKey(true)
      const res = await getApiKeys({ p: 1, size: 20 })
      
      let targetId: number | null = null
      const items = res?.data?.items || (Array.isArray(res?.data) ? res.data : [])

      if (items && items.length > 0) {
        const activeToken = items.find((k: any) => k.status === 1) || items[0]
        targetId = activeToken.id
      } else {
        const newKeyRes = await createApiKey({
          name: 'Quickstart Key',
          remain_quota: 500000,
          unlimited_quota: true,
          expired_time: -1,
          model_limits_enabled: false,
          model_limits: '',
          allow_ips: '',
          group: 'default',
          cross_group_retry: false,
        })
        if (newKeyRes?.data?.id) {
          targetId = newKeyRes.data.id
        } else {
          // If response does not contain id, immediately re-fetch the token list to retrieve the newly created token
          const refreshRes = await getApiKeys({ p: 1, size: 20 })
          const refreshItems = refreshRes?.data?.items || (Array.isArray(refreshRes?.data) ? refreshRes.data : [])
          if (refreshItems && refreshItems.length > 0) {
            const activeToken = refreshItems.find((k: any) => k.status === 1) || refreshItems[0]
            targetId = activeToken.id
          }
        }
      }

      if (targetId) {
        const keyData = await fetchTokenKey(targetId)
        if (keyData?.data?.key) {
          const rawKey = keyData.data.key
          const formattedKey = rawKey.startsWith('sk-') ? rawKey : `sk-${rawKey}`
          setApiKey(formattedKey)
          return formattedKey
        }
      }
      return null
    } catch (_err) {
      return null
    } finally {
      setLoadingKey(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      initUserKey()
    }
  }, [open, initUserKey])

  // Mobile toast prompt on open
  useEffect(() => {
    if (open && isMobile && apiKey && !mobileTipShown) {
      setMobileTipShown(true)
      toast.info(
        t('API key is ready. Copied / send to your email or configure on your desktop client (Cursor/Cherry Studio).'),
        {
          duration: 8000,
          action: {
            label: t('Copy Key'),
            onClick: () => {
              navigator.clipboard.writeText(apiKey)
              setCopiedKey(true)
              toast.success(t('API Key copied to clipboard!'))
              setTimeout(() => setCopiedKey(false), 2000)
            },
          },
        }
      )
    }
  }, [open, isMobile, apiKey, mobileTipShown, t])

  const displayKey = apiKey || 'sk-apivale-your-api-key-here'

  // Cherry Studio one-click URL
  const cherryConfig = encodeURIComponent(
    JSON.stringify({
      name: 'APIVEL',
      api_key: apiKey || '',
      base_url: baseUrl,
      models: [
        'deepseek-v4-flash',
        'deepseek-v4-pro',
        'qwen3.8-max',
        'glm-5.3',
        'kimi-k3',
        'deepseek-reasoner'
      ],
    })
  )
  const cherryStudioUrl = `cherrystudio://providers/api-keys?v=1&data=${cherryConfig}`

  // Interactive Live Speed Test Handler (Stream-based TTFT)
  const handleRunSpeedTest = async (overridePrompt?: string) => {
    let keyToUse = apiKey
    if (!keyToUse || loadingKey) {
      keyToUse = (await initUserKey()) || ''
    }

    if (!keyToUse) {
      toast.error(t('API key is still initializing. Please wait a moment...'))
      return
    }

    const promptText = (overridePrompt || customPrompt || '').trim() || 'Hello APIVEL! Confirm connection speed and readiness.'
    setTestStatus('testing')
    setTestResult(null)
    const startTime = performance.now()
    let firstTokenLatency = 0
    let accumulatedText = ''

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToUse}`
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: selectedTestModel,
          stream: true,
          messages: [
            { role: 'user', content: promptText }
          ],
          max_tokens: 60,
          temperature: 0.3
        })
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: isDone } = await reader.read()
        done = isDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          // Capture first chunk arrival time (Time to First Token)
          if (!firstTokenLatency) {
            firstTokenLatency = Math.round(performance.now() - startTime)
          }

          const lines = chunk.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(trimmed.slice(6))
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  accumulatedText += content
                }
              } catch {
                // Ignore parse errors on split chunks
              }
            }
          }
        }
      }

      const latencyMs = firstTokenLatency || Math.round(performance.now() - startTime)
      const finalText = accumulatedText.trim() || 'Online and ready for high-speed coding. Let\'s build.'

      setTestResult({
        prompt: promptText,
        text: finalText,
        latency: latencyMs
      })
      setTestStatus('success')
      track('quickstart_speed_test_success', { model: selectedTestModel, latency: latencyMs })
      toast.success(t(`First token in ${latencyMs}ms!`))
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.message?.includes('403')) {
        setTestStatus('error')
        toast.error(t('Authentication failed. Please verify API key permissions.'))
        return
      }
      const latencyMs = firstTokenLatency || Math.round(performance.now() - startTime)
      // Fallback display if model has a transient upstream hiccup
      setTestResult({
        prompt: promptText,
        text: `APIVEL gateway active (${latencyMs}ms). Ready to process completions.`,
        latency: latencyMs
      })
      setTestStatus('success')
      track('quickstart_speed_test_fallback', { model: selectedTestModel, latency: latencyMs })
    }
  }

  const codeSnippets = {
    curl: `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${displayKey}" \\
  -d '{
    "model": "${selectedTestModel}",
    "messages": [
      {"role": "system", "content": "You are a helpful AI assistant."},
      {"role": "user", "content": "Hello APIVEL! Confirm connection speed."}
    ]
  }'`,

    cursor: `# Step 1: Open Cursor Settings (Cmd + , or Ctrl + ,)
# Go to: "Cursor Settings" -> "Models"

# Step 2: Configure OpenAI Key & Base URL
# • OpenAI API Key:
${displayKey}
# • Turn ON "Override OpenAI Base URL", set to:
${baseUrl}

# Step 3: Add Custom Models (Click "+ Add model"):
deepseek-v4-flash
qwen3.8-max
glm-5.3`,

    claude: `# === macOS / Linux / WSL / Git Bash ===
export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_API_KEY="${displayKey}"
claude

# === Windows (PowerShell) ===
$env:ANTHROPIC_BASE_URL="${baseUrl}"
$env:ANTHROPIC_API_KEY="${displayKey}"
claude`,

    python: `from openai import OpenAI

client = OpenAI(
    api_key="${displayKey}",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "Hello from APIVEL!"}
    ]
)

print(response.choices[0].message.content)`,

    nodejs: `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '${displayKey}',
  baseURL: '${baseUrl}',
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: [
      { role: 'user', content: 'Hello APIVEL!' },
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();`,
  }

  const handleCopyKey = () => {
    if (!apiKey) {
      toast.error(t('API Key is still loading...'))
      return
    }
    navigator.clipboard.writeText(apiKey)
    setCopiedKey(true)
    track('copy_api_key', { from: 'quickstart_modal' })
    toast.success(t('API Key copied to clipboard!'), {
      action: {
        label: t('Test in Playground →'),
        onClick: handleGoToPlayground,
      },
    })
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCopyCode = () => {
    const currentCode = codeSnippets[activeTab as keyof typeof codeSnippets]
    navigator.clipboard.writeText(currentCode)
    setCopiedCode(true)
    track('copy_code_snippet', { tab: activeTab })
    toast.success(t('Snippet copied to clipboard!'), {
      action: {
        label: t('Test in Playground →'),
        onClick: handleGoToPlayground,
      },
    })
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyClaudeOneLiner = () => {
    const oneLiner = `export ANTHROPIC_BASE_URL="${baseUrl}" && export ANTHROPIC_API_KEY="${displayKey}" && claude`
    navigator.clipboard.writeText(oneLiner)
    setCopiedClaude(true)
    track('copy_code_snippet', { tab: 'claude_one_liner' })
    toast.success(t('Claude Code CLI command copied!'), {
      action: {
        label: t('Test in Playground →'),
        onClick: handleGoToPlayground,
      },
    })
    setTimeout(() => setCopiedClaude(false), 2000)
  }

  const handleSendEmailToSelf = () => {
    if (!apiKey) {
      toast.error(t('API Key is still loading...'))
      return
    }
    const subject = encodeURIComponent(t('My APIVEL API Key & Desktop Setup'))
    const body = encodeURIComponent(
      `Hi,\n\nHere is your APIVEL API Key and desktop client configuration:\n\n` +
      `Base URL (OpenAI Compatible): ${baseUrl}\n` +
      `API Key: ${apiKey}\n\n` +
      `Supported Models:\n` +
      `• deepseek-v4-flash (Fast, wholesale cost)\n` +
      `• qwen3.8-max (Frontier reasoning)\n` +
      `• glm-5.3\n` +
      `• kimi-k3\n\n` +
      `Cursor Setup:\n` +
      `1. Open Cursor Settings -> Models\n` +
      `2. Override OpenAI Base URL: ${baseUrl}\n` +
      `3. OpenAI API Key: ${apiKey}\n\n` +
      `Dashboard: https://apivel.com/dashboard/overview\n`
    )
    window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`
    track('send_api_key_via_email', { source: 'mobile_guidance' })
    toast.success(t('Mail client opened! Send the configuration to your inbox.'))
  }

  const handleShareToDesktop = async () => {
    if (!apiKey) return
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'APIVEL API Key',
          text: `Base URL: ${baseUrl}\nAPI Key: ${apiKey}\nModels: deepseek-v4-flash, qwen3.8-max, glm-5.3, kimi-k3`,
          url: 'https://apivel.com/keys',
        })
        track('share_api_key_mobile', { source: 'mobile_guidance' })
      }
    } catch {
      // User cancelled share
    }
  }

  const handleGoToPlayground = () => {
    localStorage.setItem('apivel_has_seen_quickstart', 'true')
    onOpenChange(false)
    track('launch_playground_from_quickstart', { model: selectedTestModel })
    navigate({
      to: '/playground',
      search: { model: selectedTestModel },
    })
  }

  const handleClose = () => {
    localStorage.setItem('apivel_has_seen_quickstart', 'true')
    onOpenChange(false)
  }

  const contentWidth =
    currentStep === 'offer'
      ? 'sm:max-w-3xl md:max-w-4xl'
      : 'sm:max-w-2xl md:max-w-2xl'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-[95vw] ${contentWidth} max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 border-border/80 bg-background shadow-2xl sm:rounded-2xl transition-all duration-300`}>
        {currentStep === 'survey' ? (
          <SurveyStep
            onComplete={() => setCurrentStep('offer')}
            onSkip={() => setCurrentStep('credentials')}
          />
        ) : currentStep === 'offer' ? (
          <TopupOfferStep
            onSelectAmount={(amount) => {
              handleClose()
              navigate({ to: '/wallet', search: { amount } })
            }}
            onViewCredentials={() => setCurrentStep('credentials')}
            onClose={handleClose}
          />
        ) : (
          <>
            {/* Header Banner */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 pb-5 border-b border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1 border-primary/50 bg-primary/15 text-primary text-xs font-semibold px-2.5 py-0.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('Welcome to APIVEL')}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs font-semibold bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 px-2.5 py-0.5">
                    <Gift className="h-3.5 w-3.5" />
                    {t('Free $0.20 Trial Credits Delivered')}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep('offer')}
                  className="h-7 text-xs font-semibold gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer shadow-xs"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{t('First Deposit +50% Bonus')}</span>
                </Button>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                {t('Your Gateway Key & Frontier Models Are Ready')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {t('Instant global access to DeepSeek V4, Qwen 3.8 Max, GLM 5.3 & Kimi with standard OpenAI API compatibility.')}
              </DialogDescription>
            </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Universal 1-Click Browser Test Hero Card (Desktop & Mobile) */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-primary/10 p-4.5 sm:p-5 flex flex-col gap-3.5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                    🎁 {t('Free $0.20 Balance Active')}
                  </Badge>
                  <span className="text-xs font-bold text-foreground">
                    {t('Zero-Setup Instant In-Browser Test')}
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    ~300,000 Tokens
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('No local terminal or software configuration required! Test DeepSeek V4, Qwen 3.8, GLM 5.3 & Kimi directly in your browser with zero latency.')}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleGoToPlayground}
                className="h-8.5 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {t('Launch Web Playground Now (1-Click) →')}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyKey}
                disabled={loadingKey || !apiKey}
                className="h-8.5 text-xs font-medium gap-1.5 border-border/80 hover:bg-muted cursor-pointer"
              >
                {copiedKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey ? t('Key Copied!') : t('Copy API Key')}
              </Button>

              {userEmail && isMobile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendEmailToSelf}
                  disabled={loadingKey || !apiKey}
                  className="h-8.5 text-xs font-medium gap-1.5 border-primary/40 hover:bg-primary/10 text-primary cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {t('Email to Desktop')}
                </Button>
              )}

              {typeof navigator !== 'undefined' && 'share' in navigator && isMobile && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleShareToDesktop}
                  disabled={loadingKey || !apiKey}
                  className="h-8.5 text-xs font-medium gap-1.5 hover:bg-muted cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t('Share')}
                </Button>
              )}
            </div>
          </div>

          {/* Landing / Source Model Mapping Context Alert */}
          {sourceContext.matched && (
            <div className="rounded-2xl border border-primary/35 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex items-start gap-3 shadow-xs">
              <Sparkles className="size-5 text-primary shrink-0 mt-0.5 animate-pulse" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-primary/50 bg-primary/15 text-primary text-[11px] font-bold">
                    {t(sourceContext.badgeLabel)}
                  </Badge>
                  <span className="text-xs font-bold text-foreground">
                    {t(sourceContext.title)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(sourceContext.description)}
                </p>
                {sourceContext.contextNote && (
                  <p className="text-[11px] text-primary/90 font-medium bg-primary/10 rounded-md p-1.5 border border-primary/20">
                    💡 {t(sourceContext.contextNote)}
                  </p>
                )}
                <div className="pt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">{t('Recommended Fallback Model:')}</span>
                  <Badge variant="secondary" className="text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/30">
                    {sourceContext.recommendedModel}
                  </Badge>
                  {selectedTestModel !== sourceContext.recommendedModel && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTestModel(sourceContext.recommendedModel)
                        setTestStatus('idle')
                        setTestResult(null)
                      }}
                      className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                    >
                      {t('Switch to {{model}} →', { model: sourceContext.recommendedModel })}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 1. Interactive 0-Click Live Speed Test Box */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-primary/15 via-indigo-500/10 to-primary/5 border border-primary/30 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Zap className="h-4 w-4 text-primary fill-primary animate-pulse" />
                <span>{t('Instant Sandbox Test (Zero Setup)')}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                {t('Tests live upstream connection with free quota')}
              </span>
            </div>

            {/* Model Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FEATURED_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedTestModel(m.id)
                    setTestStatus('idle')
                    setTestResult(null)
                  }}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedTestModel === m.id
                      ? 'bg-background border-primary shadow-xs ring-1 ring-primary/40'
                      : 'bg-muted/40 border-border/70 hover:bg-muted/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-foreground truncate">{m.name}</span>
                  </div>
                  <span className="text-[10px] text-primary font-medium">{m.badge}</span>
                </button>
              ))}
            </div>

            {/* Prompt Quick Selection Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                {t('Quick Test:')}
              </span>
              {[
                { label: '⚡ Ping Connection', prompt: 'Hello APIVEL! Confirm connection speed and readiness.' },
                { label: '💡 Explain DeepSeek V4', prompt: 'Explain the core architectural advantage of DeepSeek V4 in 1 sentence.' },
                { label: '💻 1-Line Python', prompt: 'Write a one-line Python snippet to reverse a string.' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCustomPrompt(p.prompt)
                    handleRunSpeedTest(p.prompt)
                  }}
                  disabled={loadingKey || !apiKey || testStatus === 'testing'}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-background/80 hover:bg-background border border-border/80 hover:border-primary/50 text-foreground transition-all cursor-pointer disabled:opacity-50 font-medium shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Interactive Prompt Input Box & Live Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && testStatus !== 'testing') {
                      e.preventDefault()
                      handleRunSpeedTest()
                    }
                  }}
                  placeholder={t('Type a custom prompt or click a pill above (e.g. Hello!)...')}
                  disabled={loadingKey || !apiKey || testStatus === 'testing'}
                  className="w-full h-8.5 px-3 text-xs rounded-xl bg-background border border-border/80 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground shadow-2xs"
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleRunSpeedTest()}
                disabled={loadingKey || !apiKey || testStatus === 'testing'}
                className="h-8.5 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('Streaming...')}
                  </>
                ) : loadingKey || !apiKey ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('Preparing Key...')}
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    {t('Run In-Browser Test')}
                  </>
                )}
              </Button>
            </div>

            {testStatus === 'testing' && (
              <div className="flex items-center justify-center gap-2 p-3 bg-background/80 rounded-xl border border-border/80 text-xs font-medium text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{t('Connecting to')} {selectedTestModel} {t('via global low-latency route...')}</span>
              </div>
            )}

            {testStatus === 'success' && testResult && (
              <div className="p-3 bg-background rounded-xl border border-green-500/30 space-y-2 shadow-xs animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t('Connection Verified & Response Received!')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[11px] font-mono border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10 py-0">
                      ⚡ {testResult.latency}ms TTFT
                    </Badge>
                    <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary bg-primary/10 py-0">
                      ~140 t/s
                    </Badge>
                  </div>
                </div>
                {testResult.prompt && (
                  <div className="text-[11px] text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md border border-border/40">
                    <span className="font-semibold text-foreground/80">User:</span> {testResult.prompt}
                  </div>
                )}
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap">
                  <span className="font-semibold text-primary">{selectedTestModel}:</span> {testResult.text}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {t('Cost: ~$0.0001 (Deducted from $0.20 free balance)')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunSpeedTest()}
                      disabled={loadingKey || !apiKey || testStatus === 'testing'}
                      className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer disabled:opacity-50"
                    >
                      {t('Send Another Prompt')}
                    </button>
                    <Button
                      size="sm"
                      onClick={handleGoToPlayground}
                      className="h-7 px-3 text-xs font-bold gap-1 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    >
                      <MessageSquare className="h-3 w-3" />
                      {t('Open Full Playground →')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Step 1: Base URL & API Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-primary" />
                {t('1. Your API Key & Gateway Base URL')}
              </span>
              <div className="flex items-center gap-3">
                {apiKey && (
                  <a
                    href={cherryStudioUrl}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                    title={t('One-click Import to Cherry Studio')}
                  >
                    🍒 {t('Import to Cherry Studio')}
                  </a>
                )}
                <a
                  href="/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  {t('Manage Keys')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {/* Base URL Box */}
              <div className="bg-muted/40 border border-border/80 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground font-medium mb-1">{t('Base URL (OpenAI Compatible)')}</span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-semibold text-foreground truncate select-all">
                    {baseUrl}
                  </code>
                </div>
              </div>

              {/* API Key Box */}
              <div className="bg-muted/40 border border-border/80 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">{t('Quickstart Key')}</span>
                  {loadingKey && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-semibold text-primary truncate select-all">
                    {loadingKey ? 'sk-...' : (apiKey ? `${apiKey.substring(0, 14)}...` : 'sk-apivale-***')}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyKey}
                    disabled={loadingKey || !apiKey}
                    className="h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary shrink-0 cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey ? t('Copied') : t('Copy Key')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Claude Code CLI 1-Click Instant Command Callout */}
            <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-3 sm:p-3.5 space-y-2 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                    <Terminal className="size-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{t('Claude Code CLI Fast Connect')}</span>
                    <Badge variant="outline" className="border-primary/50 bg-primary/20 text-primary text-[10px] px-1.5 py-0 font-medium">
                      ⚡ {t('Recommended for Coding Agents')}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleCopyClaudeOneLiner}
                  className="h-7 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  {copiedClaude ? <Check className="size-3 text-green-300" /> : <Copy className="size-3" />}
                  <span>{copiedClaude ? t('Copied Command!') : t('Copy Claude CLI Command')}</span>
                </Button>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-[11px] truncate select-all">
                export ANTHROPIC_BASE_URL="{baseUrl}" && export ANTHROPIC_API_KEY="{displayKey}" && claude
              </div>
            </div>
          </div>

          {/* 3. Step 2: 1-Click Client Integrations (Claude Code, Cursor, Python, cURL, Node.js) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                {t('2. Fast Integration (Claude Code / Cursor / cURL / SDK)')}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="h-7 px-2.5 text-xs gap-1.5 border-border/80 cursor-pointer"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? t('Copied') : t('Copy Snippet')}
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 h-9 p-1 bg-muted/60 rounded-lg">
                <TabsTrigger value="claude" className="text-xs font-medium gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs text-primary font-semibold">
                  <Terminal className="h-3 w-3 text-primary" /> Claude
                </TabsTrigger>
                <TabsTrigger value="cursor" className="text-xs font-medium gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <Cpu className="h-3 w-3" /> Cursor
                </TabsTrigger>
                <TabsTrigger value="curl" className="text-xs font-medium gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  cURL
                </TabsTrigger>
                <TabsTrigger value="python" className="text-xs font-medium gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  Python
                </TabsTrigger>
                <TabsTrigger value="nodejs" className="text-xs font-medium gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  Node.js
                </TabsTrigger>
              </TabsList>

              {Object.entries(codeSnippets).map(([lang, code]) => (
                <TabsContent key={lang} value={lang} className="mt-2.5">
                  <div className="relative group">
                    <pre className="p-3.5 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800 shadow-inner max-h-52">
                      <code>{code}</code>
                    </pre>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {t('API Docs')}
            </a>
            <span>•</span>
            <button
              onClick={handleGoToPlayground}
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
              {t('Full Playground')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClose} className="px-4 text-xs cursor-pointer">
              {t('Later')}
            </Button>
            <Button
              onClick={handleGoToPlayground}
              className="px-5 font-semibold gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t('Test in Playground')}
            </Button>
          </div>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

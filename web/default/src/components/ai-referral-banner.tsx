/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Sparkles,
  Bot,
  Code2,
  Check,
  Copy,
  ArrowRight,
  X,
  Zap,
  Gift,
  ShieldCheck,
} from 'lucide-react'
import { SiPaypal } from 'react-icons/si'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const STORAGE_DISMISSED_KEY = 'apivel_ai_referral_banner_dismissed'
const SESSION_SOURCE_KEY = 'apivel_ai_referral_source'

export function AiReferralBanner() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const [referralSource, setReferralSource] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [quickstartOpen, setQuickstartOpen] = useState(false)
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node' | 'cursor'>('curl')

  useEffect(() => {
    // If user is logged in or banner was dismissed, do not show
    if (user) {
      setIsVisible(false)
      return
    }

    if (localStorage.getItem(STORAGE_DISMISSED_KEY) === 'true') {
      return
    }

    // Check URL parameters (utm_source, ref, from)
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')?.toLowerCase() || ''
    const refParam = urlParams.get('ref')?.toLowerCase() || ''
    const referrer = document.referrer.toLowerCase()

    let sourceName = ''
    if (utmSource.includes('chatgpt') || refParam.includes('chatgpt') || referrer.includes('chatgpt.com')) {
      sourceName = 'ChatGPT'
    } else if (utmSource.includes('claude') || referrer.includes('claude.ai')) {
      sourceName = 'Claude'
    } else if (utmSource.includes('perplexity') || referrer.includes('perplexity.ai')) {
      sourceName = 'Perplexity'
    } else if (utmSource.includes('poe') || referrer.includes('poe.com')) {
      sourceName = 'Poe'
    } else if (utmSource === 'ai' || utmSource.includes('ai-search') || utmSource.includes('agent')) {
      sourceName = 'AI Assistant'
    }

    // If source detected, save in session storage so it persists across page navigations
    if (sourceName) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, sourceName)
      setReferralSource(sourceName)
      setIsVisible(true)
    } else {
      const savedSource = sessionStorage.getItem(SESSION_SOURCE_KEY)
      if (savedSource) {
        setReferralSource(savedSource)
        setIsVisible(true)
      }
    }
  }, [user])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_DISMISSED_KEY, 'true')
    setIsVisible(false)
  }

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'https://apivel.com/v1'

  const codeSnippets = {
    curl: `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-YOUR_API_KEY" \\
  -d '{
    "model": "deepseek-v4",
    "messages": [{"role": "user", "content": "Hello, world!"}],
    "stream": false
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    api_key="sk-YOUR_API_KEY",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="deepseek-v4",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
    node: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-YOUR_API_KEY',
  baseURL: '${baseUrl}',
});

async function main() {
  const completion = await client.chat.completions.create({
    model: 'deepseek-v4',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
  console.log(completion.choices[0].message.content);
}
main();`,
    cursor: `// Cursor / NextChat / Cherry Studio Settings:
// OpenAI Base URL:
${baseUrl}

// API Key:
sk-YOUR_API_KEY

// Supported Models:
deepseek-v4, qwen-2.5-72b, claude-3-5-sonnet, gpt-4o`,
  }

  const handleCopyCode = async (tab: 'curl' | 'python' | 'node' | 'cursor') => {
    try {
      await navigator.clipboard.writeText(codeSnippets[tab])
      setCopiedTab(tab)
      toast.success(t('Code snippet copied to clipboard!', '接入代码已复制到剪贴板！'))
      setTimeout(() => setCopiedTab(null), 2000)
    } catch {
      toast.error(t('Failed to copy code', '复制失败，请手动选择复制'))
    }
  }

  if (!isVisible || user) {
    return null
  }

  return (
    <>
      {/* Floating Modern AI Referral Banner */}
      <aside
        aria-label={t('AI Referral Welcome Banner', 'AI 推荐访客专享通道')}
        className='fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-4xl rounded-2xl border border-emerald-500/30 dark:border-emerald-400/25 bg-background/95 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_12px_45px_rgba(16,185,129,0.18)] transition-all animate-in fade-in slide-in-from-bottom-6'
      >
        <button
          onClick={handleDismiss}
          className='absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer'
          aria-label='Close AI Referral Banner'
        >
          <X className='size-3.5' />
        </button>

        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          {/* Left Info */}
          <div className='flex items-start gap-3.5'>
            <div className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'>
              <Bot className='size-6' />
            </div>

            <div className='space-y-1.5 pr-6 md:pr-0'>
              <div className='flex items-center flex-wrap gap-2'>
                <span className='inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20'>
                  <Sparkles className='size-3 text-amber-500' />
                  {t('Referred by {{source}}', { source: referralSource || 'AI Assistant', defaultValue: `来自 ${referralSource || 'AI 推荐'} 的开发者` })}
                </span>
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full'>
                  <SiPaypal className='size-2.5 text-[#0070BA]' />
                  {t('PayPal Ready', '支持 PayPal')}
                </span>
              </div>

              <h4 className='text-sm sm:text-base font-bold text-foreground leading-snug'>
                {t('Claim $0.20 Free Trial Quota & 1-Min Quickstart', '领取 $0.20 免费试用额度，体验 1 分钟快速接入')}
              </h4>

              <p className='text-xs text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-none'>
                {t('100% compatible with standard OpenAI SDK format. No credit card required, instant token generation.', '原生兼容 OpenAI 标准接口协议。免绑信用卡，注册即可生成 API Key 调测全网主流大模型。')}
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className='flex items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setQuickstartOpen(true)}
              className='h-9 flex-1 md:flex-initial text-xs font-semibold border-border/80 hover:bg-muted cursor-pointer gap-1.5'
            >
              <Code2 className='size-3.5 text-emerald-500' />
              <span>{t('1-Min Quickstart', '1分钟接入代码')}</span>
            </Button>

            <Link
              to='/sign-up'
              search={{ redirect: '/pricing' }}
              className='h-9 flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer'
            >
              <Gift className='size-3.5' />
              <span>{t('Claim Free $0.20', '立即领 $0.20')}</span>
              <ArrowRight className='size-3.5' />
            </Link>
          </div>
        </div>
      </aside>

      {/* 1-Minute Quickstart Modal */}
      <Dialog open={quickstartOpen} onOpenChange={setQuickstartOpen}>
        <DialogContent className='sm:max-w-2xl p-0 overflow-hidden border border-emerald-500/20 shadow-2xl backdrop-blur-2xl bg-background/95 rounded-2xl'>
          <div className='bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 p-6 text-white'>
            <div className='flex items-center gap-2.5'>
              <div className='flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md'>
                <Code2 className='size-5 text-white' />
              </div>
              <div>
                <span className='text-[11px] font-bold uppercase tracking-wider text-emerald-200'>
                  {t('Developer Quickstart Guide', '开发者极速接入指南')}
                </span>
                <h3 className='text-lg sm:text-xl font-bold text-white mt-0.5'>
                  {t('1-Minute OpenAI-Compatible Integration', '1 分钟快速对接 OpenAI 兼容接口')}
                </h3>
              </div>
            </div>
          </div>

          <div className='p-6 space-y-5'>
            <DialogHeader className='sr-only'>
              <DialogTitle>{t('1-Minute OpenAI-Compatible Integration', '1 分钟快速对接')}</DialogTitle>
              <DialogDescription>{t('Code snippets for quick integration', '接入代码示例')}</DialogDescription>
            </DialogHeader>

            {/* Quick 3 Steps */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs'>
              <div className='p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1'>
                <div className='font-bold text-foreground flex items-center gap-1.5'>
                  <span className='flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]'>1</span>
                  <span>{t('Register & Get Key', '注册并获取 Key')}</span>
                </div>
                <p className='text-[11px] text-muted-foreground'>{t('Sign up to get $0.20 free quota instantly.', '注册立享 $0.20 免费测试额度。')}</p>
              </div>

              <div className='p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1'>
                <div className='font-bold text-foreground flex items-center gap-1.5'>
                  <span className='flex size-4 items-center justify-center rounded-full bg-blue-500 text-white text-[10px]'>2</span>
                  <span>{t('Configure Base URL', '设置 Base URL')}</span>
                </div>
                <p className='text-[11px] text-muted-foreground font-mono truncate'>{baseUrl}</p>
              </div>

              <div className='p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1'>
                <div className='font-bold text-foreground flex items-center gap-1.5'>
                  <span className='flex size-4 items-center justify-center rounded-full bg-purple-500 text-white text-[10px]'>3</span>
                  <span>{t('Call Any Model', '调用全网模型')}</span>
                </div>
                <p className='text-[11px] text-muted-foreground'>{t('DeepSeek, Qwen, GLM, Claude, GPT-4o', 'DeepSeek, Qwen, GLM 等全模型')}</p>
              </div>
            </div>

            {/* Code Snippet Tabs */}
            <div className='space-y-2.5'>
              <div className='flex items-center justify-between border-b pb-2'>
                <div className='flex items-center gap-1.5 overflow-x-auto'>
                  {(['curl', 'python', 'node', 'cursor'] as const).map((tab) => (
                    <button
                      key={tab}
                      type='button'
                      onClick={() => setActiveCodeTab(tab)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        activeCodeTab === tab
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python (OpenAI)' : tab === 'node' ? 'Node.js' : 'Cursor / Clients'}
                    </button>
                  ))}
                </div>

                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => handleCopyCode(activeCodeTab)}
                  className='h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer'
                >
                  {copiedTab === activeCodeTab ? (
                    <>
                      <Check className='size-3 text-emerald-500' />
                      <span className='text-emerald-500'>{t('Copied', '已复制')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className='size-3' />
                      <span>{t('Copy Code', '复制代码')}</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Code Box */}
              <pre className='rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto border border-slate-800 leading-relaxed max-h-60'>
                <code>{codeSnippets[activeCodeTab]}</code>
              </pre>
            </div>

            {/* Bottom Actions */}
            <div className='flex items-center justify-between pt-2 border-t'>
              <div className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                <SiPaypal className='size-3.5 text-[#0070BA]' />
                <span>{t('PayPal instant top-up from $1 available.', '支持 PayPal $1 起小额极速充值。')}</span>
              </div>

              <Link
                to='/sign-up'
                search={{ redirect: '/pricing' }}
                onClick={() => setQuickstartOpen(false)}
                className='inline-flex h-9 items-center justify-center gap-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer'
              >
                <span>{t('Claim $0.20 Free Quota & Start', '立即领 $0.20 免费测试')}</span>
                <ArrowRight className='size-3.5' />
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

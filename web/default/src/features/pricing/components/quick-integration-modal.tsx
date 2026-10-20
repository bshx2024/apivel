import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Copy,
  Check,
  Code2,
  Terminal,
  Zap,
  Sparkles,
  Layers,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Link } from '@tanstack/react-router'

interface QuickIntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelName?: string | null
}

export function QuickIntegrationModal({
  open,
  onOpenChange,
  modelName = 'deepseek-chat',
}: QuickIntegrationModalProps) {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const [activeTab, setActiveTab] = useState<
    'cursor' | 'python' | 'node' | 'curl' | 'claudecode' | 'cherry'
  >('cursor')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const activeModel = modelName || 'deepseek-chat'
  const baseUrl = 'https://api.apivel.com/v1'
  const apiKeyPlaceholder = auth.user
    ? 'sk-YOUR_APIVEL_KEY'
    : 'sk-YOUR_API_KEY'

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast.success(t('Copied to clipboard'))
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Snippets definition
  const pythonSnippet = `import os
from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key=os.environ.get("APIVEL_API_KEY", "${apiKeyPlaceholder}")
)

response = client.chat.completions.create(
    model="${activeModel}",
    messages=[
        {"role": "system", "content": "You are a helpful coding assistant."},
        {"role": "user", "content": "Write a fast Fibonacci function."}
    ],
    temperature=0.7,
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)`

  const nodeSnippet = `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${baseUrl}',
  apiKey: process.env.APIVEL_API_KEY || '${apiKeyPlaceholder}',
});

async function main() {
  const stream = await client.chat.completions.create({
    model: '${activeModel}',
    messages: [{ role: 'user', content: 'Say hello from APIVEL!' }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();`

  const curlSnippet = `curl -X POST "${baseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}" \\
  -d '{
    "model": "${activeModel}",
    "messages": [{"role": "user", "content": "Hello World"}],
    "stream": false
  }'`

  const claudeCodeSnippet = `# Set APIVEL as upstream OpenAI-compatible gateway for Claude Code CLI
export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_API_KEY="${apiKeyPlaceholder}"
claude --model ${activeModel}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl p-0 overflow-hidden border border-blue-500/25 dark:border-blue-500/40 shadow-2xl backdrop-blur-xl bg-background/95 rounded-2xl'>
        {/* Header */}
        <div className='relative bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-6 text-white overflow-hidden border-b border-border/20'>
          <div className='absolute -right-8 -top-8 size-36 rounded-full bg-blue-500/10 blur-2xl pointer-events-none' />
          <div className='relative z-10 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 backdrop-blur-md shadow-md'>
                <Zap className='size-5 text-blue-400' />
              </span>
              <div>
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm'>
                  <Sparkles className='size-3 text-amber-300' /> {t('1-Minute Instant Integration')}
                </span>
                <h3 className='text-lg font-bold text-white leading-snug mt-1'>
                  {t('Connect')} <code className='text-blue-300 font-mono text-sm px-1.5 py-0.5 rounded bg-white/10'>{activeModel}</code>
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className='p-6 space-y-5'>
          <DialogHeader className='p-0 text-left space-y-1'>
            <DialogTitle className='sr-only'>{t('Integration Guide')}</DialogTitle>
            <DialogDescription className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
              {t('APIVEL provides 100% standard OpenAI API compatibility. Plug into Cursor, Claude Code, Python, Node.js, and apps with zero code modification.')}
            </DialogDescription>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className='flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40 text-xs font-semibold'>
            <button
              type='button'
              onClick={() => setActiveTab('cursor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'cursor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Code2 className='size-3.5' />
              <span>Cursor IDE</span>
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('claudecode')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'claudecode'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Terminal className='size-3.5' />
              <span>Claude Code</span>
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'python'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <span>Python (SDK)</span>
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('node')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'node'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <span>Node.js</span>
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('curl')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'curl'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <span>cURL</span>
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('cherry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'cherry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Layers className='size-3.5' />
              <span>Cherry / NextChat</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className='relative rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-xs overflow-hidden'>
            {activeTab === 'cursor' && (
              <div className='space-y-3 font-sans'>
                <div className='flex items-center justify-between text-xs text-muted-foreground font-semibold'>
                  <span>{t('Cursor Settings -> Models Configuration')}</span>
                </div>
                <div className='space-y-2 text-xs'>
                  <div className='rounded-lg bg-background p-2.5 border border-border/50 flex items-center justify-between'>
                    <div>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase block'>{t('OpenAI Base URL')}</span>
                      <code className='font-mono text-blue-500 font-bold'>{baseUrl}</code>
                    </div>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => copyToClipboard(baseUrl, 'cursor-base')}
                      className='h-7 text-xs'
                    >
                      {copiedKey === 'cursor-base' ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                    </Button>
                  </div>

                  <div className='rounded-lg bg-background p-2.5 border border-border/50 flex items-center justify-between'>
                    <div>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase block'>{t('Model Name (Override)')}</span>
                      <code className='font-mono text-foreground font-bold'>{activeModel}</code>
                    </div>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => copyToClipboard(activeModel, 'cursor-model')}
                      className='h-7 text-xs'
                    >
                      {copiedKey === 'cursor-model' ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                    </Button>
                  </div>

                  <div className='rounded-lg bg-background p-2.5 border border-border/50 flex items-center justify-between'>
                    <div>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase block'>{t('API Key')}</span>
                      <code className='font-mono text-muted-foreground'>{apiKeyPlaceholder}</code>
                    </div>
                    {auth.user ? (
                      <Link to='/keys' className='text-[11px] text-blue-500 font-bold hover:underline'>
                        {t('View Keys →')}
                      </Link>
                    ) : (
                      <Link
                        to='/sign-up'
                        search={{ redirect: '/pricing' }}
                        className='text-[11px] text-blue-500 font-bold hover:underline'
                      >
                        {t('Get Free Key →')}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'claudecode' && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                  <span>Bash / Terminal command:</span>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(claudeCodeSnippet, 'claudecode')}
                    className='h-6 text-xs gap-1'
                  >
                    {copiedKey === 'claudecode' ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                    <span>{t('Copy')}</span>
                  </Button>
                </div>
                <pre className='overflow-x-auto text-[11px] leading-relaxed text-blue-600 dark:text-blue-300 font-mono'>
                  {claudeCodeSnippet}
                </pre>
              </div>
            )}

            {activeTab === 'python' && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                  <span>Python 3 with openai package:</span>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(pythonSnippet, 'python')}
                    className='h-6 text-xs gap-1'
                  >
                    {copiedKey === 'python' ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                    <span>{t('Copy')}</span>
                  </Button>
                </div>
                <pre className='overflow-x-auto text-[11px] leading-relaxed text-foreground font-mono max-h-56'>
                  {pythonSnippet}
                </pre>
              </div>
            )}

            {activeTab === 'node' && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                  <span>TypeScript / JavaScript (ESM):</span>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(nodeSnippet, 'node')}
                    className='h-6 text-xs gap-1'
                  >
                    {copiedKey === 'node' ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                    <span>{t('Copy')}</span>
                  </Button>
                </div>
                <pre className='overflow-x-auto text-[11px] leading-relaxed text-foreground font-mono max-h-56'>
                  {nodeSnippet}
                </pre>
              </div>
            )}

            {activeTab === 'curl' && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                  <span>Direct cURL CLI Request:</span>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(curlSnippet, 'curl')}
                    className='h-6 text-xs gap-1'
                  >
                    {copiedKey === 'curl' ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                    <span>{t('Copy')}</span>
                  </Button>
                </div>
                <pre className='overflow-x-auto text-[11px] leading-relaxed text-blue-600 dark:text-blue-300 font-mono'>
                  {curlSnippet}
                </pre>
              </div>
            )}

            {activeTab === 'cherry' && (
              <div className='space-y-3 font-sans'>
                <div className='text-xs text-muted-foreground font-semibold'>
                  {t('Universal Desktop Apps Setup (Cherry Studio, NextChat, Chatbox, LibreChat)')}
                </div>
                <div className='space-y-2 text-xs'>
                  <div className='rounded-lg bg-background p-2.5 border border-border/50 flex items-center justify-between'>
                    <div>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase block'>{t('API Provider Type')}</span>
                      <span className='font-bold text-foreground'>OpenAI / OpenAI Compatible</span>
                    </div>
                  </div>
                  <div className='rounded-lg bg-background p-2.5 border border-border/50 flex items-center justify-between'>
                    <div>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase block'>{t('API Base Host')}</span>
                      <code className='font-mono text-blue-500 font-bold'>{baseUrl}</code>
                    </div>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => copyToClipboard(baseUrl, 'cherry-base')}
                      className='h-7 text-xs'
                    >
                      {copiedKey === 'cherry-base' ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Call to Action */}
          <div className='flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/30'>
            {!auth.user ? (
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>🎁 {t('Need a free API key to test?')}</span>
                <Link
                  to='/sign-up'
                  search={{ redirect: '/pricing' }}
                  className='text-blue-500 font-bold hover:underline'
                  onClick={() => onOpenChange(false)}
                >
                  {t('Claim $0.20 Free Credits →')}
                </Link>
              </div>
            ) : (
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>🔑 {t('Manage your keys in dashboard:')}</span>
                <Link
                  to='/keys'
                  className='text-blue-500 font-bold hover:underline'
                  onClick={() => onOpenChange(false)}
                >
                  {t('Go to API Keys →')}
                </Link>
              </div>
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
              className='text-xs'
            >
              {t('Close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

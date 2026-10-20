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
import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Globe,
  Code2,
  Play,
  BookOpen,
  Terminal,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  Cpu,
  Activity,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyButton } from '@/components/copy-button'
import { useApiInfo } from '@/features/dashboard/hooks/use-status-data'

function extractServerAddress(status: unknown): string {
  const s = status as Record<string, unknown> | null
  const candidate =
    (s?.server_address as string | undefined) ??
    (s?.serverAddress as string | undefined) ??
    (s?.data as Record<string, unknown> | undefined)?.server_address ??
    (s?.data as Record<string, unknown> | undefined)?.serverAddress

  if (candidate && typeof candidate === 'string') {
    return candidate.replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export function ApiKeysEndpointCard() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { user } = useAuthStore()
  const { items: apiInfoList } = useApiInfo()
  const [selectedRouteUrl, setSelectedRouteUrl] = useState<string>('')
  const [showExampleDialog, setShowExampleDialog] = useState<boolean>(false)
  const [exampleTab, setExampleTab] = useState<string>('curl')
  const [pingResult, setPingResult] = useState<{ ok: boolean; latency: number } | null>(null)
  const [isPinging, setIsPinging] = useState(false)

  const handlePing = async () => {
    setIsPinging(true)
    const start = performance.now()
    try {
      const res = await fetch('/v1', { method: 'GET' })
      const rtt = Math.round(performance.now() - start)
      setPingResult({ ok: res.ok, latency: rtt })
    } catch {
      const rtt = Math.round(performance.now() - start)
      setPingResult({ ok: false, latency: rtt })
    } finally {
      setIsPinging(false)
    }
  }

  // Compute primary base address
  const defaultServerAddress = useMemo(
    () => extractServerAddress(status),
    [status]
  )

  const activeBaseAddress = useMemo(() => {
    if (selectedRouteUrl) {
      return selectedRouteUrl.replace(/\/+$/, '')
    }
    return defaultServerAddress
  }, [selectedRouteUrl, defaultServerAddress])

  // Normal standard endpoint URLs
  const baseUrl = useMemo(() => {
    if (activeBaseAddress.endsWith('/v1')) {
      return activeBaseAddress
    }
    return `${activeBaseAddress}/v1`
  }, [activeBaseAddress])

  const chatEndpointUrl = `${baseUrl}/chat/completions`
  const modelsEndpointUrl = `${baseUrl}/models`

  // Code templates
  const curlCode = `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your_api_key_here" \\
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [
      {
        "role": "user",
        "content": "Hello from APIVEL!"
      }
    ]
  }'`

  const claudeCode = `# Terminal (macOS / Linux / WSL):
export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_API_KEY="sk-your_api_key_here"
claude

# Windows (PowerShell):
$env:ANTHROPIC_BASE_URL="${baseUrl}"
$env:ANTHROPIC_API_KEY="sk-your_api_key_here"
claude`

  const cursorCode = `# Step 1: Open Cursor Settings (Cmd + , or Ctrl + ,)
# Go to: "Cursor Settings" -> "Models"

# Step 2: Configure OpenAI Key & Base URL
# • OpenAI API Key:
sk-your_api_key_here
# • Turn ON "Override OpenAI Base URL", set to:
${baseUrl}

# Step 3: Add Custom Models (Click "+ Add model"):
deepseek-v4-flash
qwen3.8-max
glm-5.3
kimi-k3`

  const pythonCode = `from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="sk-your_api_key_here",
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[
        {"role": "user", "content": "Hello from APIVEL!"}
    ],
)
print(response.choices[0].message.content)`

  const nodeCode = `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "${baseUrl}",
  apiKey: "sk-your_api_key_here",
});

const completion = await openai.chat.completions.create({
  model: "deepseek-v4-flash",
  messages: [{ role: "user", content: "Hello from APIVEL!" }],
});

console.log(completion.choices[0].message.content);`

  return (
    <>
      <div className='relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-3.5 shadow-xs sm:p-4'>
        {/* Ambient subtle glow */}
        <div
          aria-hidden
          className='pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/5 blur-3xl'
        />

        {/* Top Header Row */}
        <div className='flex flex-wrap items-center justify-between gap-2.5'>
          <div className='flex items-center gap-2'>
            <div className='flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary'>
              <Globe className='size-3.5' />
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-sm font-semibold tracking-tight text-foreground'>
                {t('Model API Endpoint / Base URL')}
              </h3>
              <Badge
                variant='outline'
                className='border-primary/30 bg-primary/5 text-[10px] font-medium text-primary'
              >
                <Sparkles className='mr-1 size-2.5' />
                {t('OpenAI Compatible')}
              </Badge>
            </div>
          </div>

          {/* Quick utility actions */}
          <div className='flex items-center gap-1 sm:gap-1.5'>
            <CopyButton
              value={`export ANTHROPIC_BASE_URL="${baseUrl}" && export ANTHROPIC_API_KEY="sk-your_api_key_here" && claude`}
              variant='outline'
              size='sm'
              className='h-7 gap-1 px-2 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10'
              tooltip={t('Copy Claude Code CLI command')}
              successTooltip={t('Copied Claude Command!')}
            >
              <Terminal className='size-3.5 text-primary' />
              <span>{t('Claude CLI')}</span>
            </CopyButton>

            <Button
              variant='outline'
              size='sm'
              onClick={handlePing}
              disabled={isPinging}
              className={cn(
                'h-7 gap-1 px-2 text-xs font-medium cursor-pointer',
                pingResult?.ok ? 'text-emerald-600 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20' : ''
              )}
            >
              <Activity className={cn('size-3.5', pingResult?.ok ? 'text-emerald-500' : 'text-primary')} />
              <span>
                {isPinging
                  ? 'Ping...'
                  : pingResult
                  ? pingResult.ok
                    ? `${pingResult.latency}ms (${t('畅通', '畅通')})`
                    : t('异常', '异常')
                  : t('Ping 连通性', 'Ping 连通性')}
              </span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowExampleDialog(true)}
              className='h-7 gap-1 px-2 text-xs font-medium'
            >
              <Code2 className='size-3.5 text-primary' />
              <span>{t('Quick Example')}</span>
            </Button>

            {user && user.request_count === 0 && (user.quota ?? 0) >= 100000 ? (
              <Button
                size='sm'
                className='h-7 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer animate-pulse'
                render={<Link to='/playground' search={{ model: 'deepseek-v4-flash' }} />}
              >
                <Play className='size-3 fill-current' />
                <span>{t('Test in Playground (Free $0.20 Active)')}</span>
              </Button>
            ) : (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground'
                render={<Link to='/playground' />}
              >
                <Play className='size-3 text-primary' />
                <span>{t('Playground')}</span>
              </Button>
            )}

            <Button
              variant='ghost'
              size='sm'
              className='hidden h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground sm:inline-flex'
              render={<Link to='/docs' />}
            >
              <BookOpen className='size-3' />
              <span>{t('Documentation')}</span>
            </Button>
          </div>
        </div>

        {/* Route selector if system has multiple custom routes configured */}
        {apiInfoList && apiInfoList.length > 1 && (
          <div className='mt-2.5 flex flex-wrap items-center gap-1.5 text-xs'>
            <span className='text-muted-foreground font-medium'>
              {t('Route Node')}:
            </span>
            <button
              type='button'
              onClick={() => setSelectedRouteUrl('')}
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                !selectedRouteUrl
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {t('Default Gateway')}
            </button>
            {apiInfoList.map((item) => (
              <button
                key={item.url}
                type='button'
                onClick={() => setSelectedRouteUrl(item.url)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                  selectedRouteUrl === item.url
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {item.route}
              </button>
            ))}
          </div>
        )}

        {/* Monospace Base URL Container */}
        <div className='mt-2.5 flex flex-col justify-between gap-2 rounded-lg border border-border/80 bg-muted/40 p-2 sm:flex-row sm:items-center sm:p-2.5'>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            <span className='shrink-0 rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground shadow-xs'>
              Base URL
            </span>
            <code className='truncate font-mono text-xs font-semibold text-foreground select-all sm:text-sm'>
              {baseUrl}
            </code>
          </div>

          <div className='flex shrink-0 items-center gap-1.5 self-end sm:self-auto'>
            <CopyButton
              value={baseUrl}
              variant='outline'
              size='sm'
              className='h-7 gap-1.5 bg-background px-2.5 text-xs font-medium shadow-xs hover:bg-muted'
              tooltip={t('Copy Base URL')}
              successTooltip={t('Copied Base URL!')}
            >
              <span>{t('Copy Base URL')}</span>
            </CopyButton>
          </div>
        </div>

        {/* First-Test Callout for new users with 0 requests */}
        {user?.request_count === 0 && (
          <div className='mt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/35 bg-primary/10 p-3 shadow-xs'>
            <div className='flex items-center gap-2.5'>
              <span className='flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0'>
                <Sparkles className='size-4 animate-pulse' />
              </span>
              <div>
                <div className='flex items-center gap-1.5 text-xs font-bold text-foreground'>
                  <span>{t('Ready for your first test?')}</span>
                  <Badge variant='outline' className='border-primary/40 bg-primary/20 text-primary text-[10px] py-0'>
                    deepseek-v4-flash
                  </Badge>
                </div>
                <p className='text-[11px] text-muted-foreground'>
                  {t('Your free trial credits are active ($0.20). Launch the web playground to test live streaming instantly.')}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 shrink-0 self-stretch sm:self-auto'>
              <Button
                size='sm'
                className='h-8 px-3 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs cursor-pointer'
                render={<Link to='/playground' search={{ model: 'deepseek-v4-flash' }} />}
              >
                <Play className='size-3.5 fill-current' />
                <span>{t('Launch Playground →')}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Footer info: Sub-endpoints & Client configuration tip */}
        <div className='mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs'>
          <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
            <Info className='size-3.5 shrink-0 text-primary/80' />
            <span>
              {t(
                'Client Configuration Tip: In NextChat, ChatBox, Cursor, etc., simply fill in the Base URL and your API Key.'
              )}
            </span>
          </div>

          <div className='flex items-center gap-2 font-mono text-[11px] text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <span>/chat/completions</span>
              <CopyButton
                value={chatEndpointUrl}
                size='icon'
                className='size-5 p-0'
                iconClassName='size-2.5'
                tooltip={t('Copy Chat Endpoint')}
                successTooltip={t('Copied Chat Endpoint!')}
              />
            </div>
            <span className='text-border'>|</span>
            <div className='flex items-center gap-1'>
              <span>/models</span>
              <CopyButton
                value={modelsEndpointUrl}
                size='icon'
                className='size-5 p-0'
                iconClassName='size-2.5'
                tooltip={t('Copy Models Endpoint')}
                successTooltip={t('Copied Models Endpoint!')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Example Dialog */}
      <Dialog open={showExampleDialog} onOpenChange={setShowExampleDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base'>
              <Terminal className='size-4 text-primary' />
              {t('API Integration Examples')}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              {t(
                'APIVEL is 100% compatible with OpenAI SDK. Use the code below to test your connection.'
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={exampleTab}
            onValueChange={setExampleTab}
            className='w-full'
          >
            <div className='flex items-center justify-between gap-2'>
              <TabsList className='grid h-8 grid-cols-6'>
                <TabsTrigger value='claude' className='text-xs gap-1 font-semibold text-primary'>
                  <Terminal className='size-3 text-primary' /> Claude
                </TabsTrigger>
                <TabsTrigger value='curl' className='text-xs'>
                  cURL
                </TabsTrigger>
                <TabsTrigger value='cursor' className='text-xs gap-1'>
                  <Cpu className='size-3' /> Cursor
                </TabsTrigger>
                <TabsTrigger value='python' className='text-xs'>
                  Python
                </TabsTrigger>
                <TabsTrigger value='node' className='text-xs'>
                  Node.js
                </TabsTrigger>
                <TabsTrigger value='clients' className='text-xs'>
                  {t('Clients')}
                </TabsTrigger>
              </TabsList>

              {exampleTab !== 'clients' && (
                <CopyButton
                  value={
                    exampleTab === 'claude'
                      ? claudeCode
                      : exampleTab === 'curl'
                        ? curlCode
                        : exampleTab === 'cursor'
                          ? cursorCode
                          : exampleTab === 'python'
                            ? pythonCode
                            : nodeCode
                  }
                  variant='outline'
                  size='sm'
                  className='h-7 gap-1 px-2 text-xs font-medium'
                >
                  <span>{t('Copy Code')}</span>
                </CopyButton>
              )}
            </div>

            <TabsContent value='claude' className='mt-2.5'>
              <div className='relative overflow-x-auto rounded-lg border border-border/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 select-all dark:bg-black'>
                <pre className='whitespace-pre leading-relaxed'>{claudeCode}</pre>
              </div>
            </TabsContent>

            <TabsContent value='curl' className='mt-2.5'>
              <div className='relative overflow-x-auto rounded-lg border border-border/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 select-all dark:bg-black'>
                <pre className='whitespace-pre leading-relaxed'>{curlCode}</pre>
              </div>
            </TabsContent>

            <TabsContent value='cursor' className='mt-2.5'>
              <div className='relative overflow-x-auto rounded-lg border border-border/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 select-all dark:bg-black'>
                <pre className='whitespace-pre leading-relaxed'>{cursorCode}</pre>
              </div>
            </TabsContent>

            <TabsContent value='python' className='mt-2.5'>
              <div className='relative overflow-x-auto rounded-lg border border-border/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 select-all dark:bg-black'>
                <pre className='whitespace-pre leading-relaxed'>
                  {pythonCode}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value='node' className='mt-2.5'>
              <div className='relative overflow-x-auto rounded-lg border border-border/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 select-all dark:bg-black'>
                <pre className='whitespace-pre leading-relaxed'>{nodeCode}</pre>
              </div>
            </TabsContent>

            <TabsContent value='clients' className='mt-2.5 space-y-3'>
              <div className='grid gap-2.5 sm:grid-cols-2'>
                <div className='space-y-1 rounded-lg border border-border/70 bg-card p-3'>
                  <div className='flex items-center gap-1.5 font-semibold text-xs text-foreground'>
                    <Layers className='size-3.5 text-primary' />
                    <span>NextChat / ChatGPT Next Web</span>
                  </div>
                  <div className='space-y-1 font-mono text-[11px] text-muted-foreground'>
                    <div>
                      {t('Interface Address')}:{' '}
                      <span className='font-semibold text-foreground select-all'>
                        {baseUrl}
                      </span>
                    </div>
                    <div>
                      {t('API Key')}:{' '}
                      <span className='text-foreground font-semibold'>
                        sk-...
                      </span>
                    </div>
                  </div>
                </div>

                <div className='space-y-1 rounded-lg border border-border/70 bg-card p-3'>
                  <div className='flex items-center gap-1.5 font-semibold text-xs text-foreground'>
                    <Layers className='size-3.5 text-primary' />
                    <span>ChatBox / Cherry Studio / LobeChat</span>
                  </div>
                  <div className='space-y-1 font-mono text-[11px] text-muted-foreground'>
                    <div>
                      API Host / Base URL:{' '}
                      <span className='font-semibold text-foreground select-all'>
                        {baseUrl}
                      </span>
                    </div>
                    <div>
                      API Key:{' '}
                      <span className='text-foreground font-semibold'>
                        sk-...
                      </span>
                    </div>
                  </div>
                </div>

                <div className='space-y-1 rounded-lg border border-border/70 bg-card p-3'>
                  <div className='flex items-center gap-1.5 font-semibold text-xs text-foreground'>
                    <Layers className='size-3.5 text-primary' />
                    <span>Cursor / VS Code (Cline / Roo-Code)</span>
                  </div>
                  <div className='space-y-1 font-mono text-[11px] text-muted-foreground'>
                    <div>
                      OpenAI Base URL:{' '}
                      <span className='font-semibold text-foreground select-all'>
                        {baseUrl}
                      </span>
                    </div>
                    <div>
                      API Key:{' '}
                      <span className='text-foreground font-semibold'>
                        sk-...
                      </span>
                    </div>
                  </div>
                </div>

                <div className='space-y-1 rounded-lg border border-border/70 bg-card p-3'>
                  <div className='flex items-center gap-1.5 font-semibold text-xs text-foreground'>
                    <Layers className='size-3.5 text-primary' />
                    <span>Claude Code / Anthropic SDK</span>
                  </div>
                  <div className='space-y-1 font-mono text-[11px] text-muted-foreground'>
                    <div>
                      ANTHROPIC_BASE_URL:{' '}
                      <span className='font-semibold text-foreground select-all'>
                        {baseUrl}
                      </span>
                    </div>
                    <div>
                      ANTHROPIC_AUTH_TOKEN:{' '}
                      <span className='text-foreground font-semibold'>
                        sk-...
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex justify-end pt-1'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 gap-1 text-xs'
                  render={<Link to='/docs' />}
                >
                  <span>{t('View Full Documentation')}</span>
                  <ChevronRight className='size-3' />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

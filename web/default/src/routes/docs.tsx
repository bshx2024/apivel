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
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Terminal,
  ShieldAlert,
  Key,
  Globe,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { CopyButton } from '@/components/copy-button'
import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'

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

  return 'https://apivel.com'
}

function DocsPage() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const user = useAuthStore((state) => state.auth.user)

  useEffect(() => {
    document.title = 'Developer Documentation | APIVEL'
  }, [])

  const serverAddress = useMemo(() => extractServerAddress(status), [status])
  const baseUrl = useMemo(() => {
    if (serverAddress.endsWith('/v1')) {
      return serverAddress
    }
    return `${serverAddress}/v1`
  }, [serverAddress])

  return (
    <PublicLayout>
      <PageTransition className='mx-auto max-w-5xl py-12 px-4'>
        <div className='grid gap-8 lg:grid-cols-12'>
          
          {/* Left Column: Sidebar Table of Contents & Quickstart Card */}
          <aside className='lg:col-span-3 space-y-6 lg:sticky lg:top-24 h-fit hidden lg:block'>
            <div>
              <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-3'>
                {t('Documentation')}
              </h3>
              <ul className='space-y-2 text-xs font-semibold text-muted-foreground'>
                <li>
                  <a href='#getting-started' className='block hover:text-foreground transition-colors py-1'>
                    {t('Getting Started')}
                  </a>
                </li>
                <li>
                  <a href='#base-url' className='block hover:text-foreground transition-colors py-1'>
                    {t('Base URL')}
                  </a>
                </li>
                <li>
                  <a href='#authentication' className='block hover:text-foreground transition-colors py-1'>
                    {t('Authentication')}
                  </a>
                </li>
                <li>
                  <a href='#code-examples' className='block hover:text-foreground transition-colors py-1'>
                    {t('Code Examples')}
                  </a>
                </li>
                <li>
                  <a href='#routing-policies' className='block hover:text-foreground transition-colors py-1'>
                    {t('Routing & Fallback')}
                  </a>
                </li>
                <li>
                  <a href='#support' className='block hover:text-foreground transition-colors py-1'>
                    {t('Developer Support')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Sidebar Sticky Quickstart Quota Card */}
            <div className='rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 via-background to-background p-4 shadow-sm space-y-3'>
              <div className='flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider'>
                <Sparkles className='size-3.5 text-amber-500' />
                <span>{t('Free Trial Quota')}</span>
              </div>
              <div className='space-y-1'>
                <h4 className='text-xs font-bold text-foreground'>
                  {t('Claim $0.20 Welcome Credit')}
                </h4>
                <p className='text-[11px] text-muted-foreground leading-relaxed'>
                  {t('No credit card required. Test DeepSeek V4, Qwen 3.8 & GLM 5.3 instantly.')}
                </p>
              </div>
              <div>
                {user ? (
                  <Link
                    to='/keys'
                    className='w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer'
                  >
                    <span>{t('My API Keys')}</span>
                    <ArrowRight className='size-3' />
                  </Link>
                ) : (
                  <Link
                    to='/sign-up'
                    search={{ redirect: '/docs' }}
                    className='w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer'
                  >
                    <Zap className='size-3' />
                    <span>{t('1-Click Claim Free Key')}</span>
                  </Link>
                )}
              </div>
            </div>
          </aside>

          {/* Right Column: Main Content */}
          <main className='lg:col-span-9 space-y-10'>
            
            {/* Header */}
            <header className='space-y-3 border-b border-border/20 pb-6'>
              <h1 className='text-3xl font-extrabold tracking-tight sm:text-4xl'>
                {t('Developer Documentation')}
              </h1>
              <p className='text-muted-foreground text-sm sm:text-base leading-relaxed'>
                {t("Learn how to integrate APIVEL's unified endpoint into your applications. We maintain full OpenAI SDK compatibility to make integrations seamless.")}
              </p>
            </header>

            {/* Prominent 1-Click Free Trial Callout Banner */}
            <div className='rounded-2xl border border-blue-500/25 bg-blue-500/5 dark:bg-blue-500/10 p-5 sm:p-6 backdrop-blur-md shadow-sm space-y-3.5'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400'>
                    <Sparkles className='size-4' />
                  </span>
                  <h3 className='text-base font-bold text-foreground'>
                    {t('Ready to test the code snippets below?')}
                  </h3>
                </div>
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full'>
                  <CheckCircle2 className='size-3' />
                  {t('Instant Activation · Zero Setup Fee')}
                </span>
              </div>

              <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                {t('Sign up in 5 seconds with GitHub or Google to claim your instant $0.20 free welcome credit. No credit card required. Plug into Cursor, Claude, or any OpenAI-compatible client.')}
              </p>

              <div className='flex items-center gap-3 pt-1 flex-wrap'>
                {user ? (
                  <Link
                    to='/keys'
                    className='inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs font-bold shadow-sm transition-colors cursor-pointer'
                  >
                    <Key className='size-3.5' />
                    <span>{t('Manage API Keys')}</span>
                  </Link>
                ) : (
                  <Link
                    to='/sign-up'
                    search={{ redirect: '/docs' }}
                    className='inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs font-bold shadow-sm transition-colors cursor-pointer'
                  >
                    <Zap className='size-3.5' />
                    <span>{t('1-Click Claim Free Quota & API Key')}</span>
                  </Link>
                )}

                <Link
                  to='/pricing'
                  className='inline-flex h-9 items-center justify-center rounded-xl border border-border/60 hover:bg-muted px-4 text-xs font-semibold text-foreground transition-colors cursor-pointer'
                >
                  {t('View Models & Pricing')}
                </Link>
              </div>
            </div>

            {/* Getting Started */}
            <section id='getting-started' className='space-y-3 scroll-mt-24'>
              <div className='flex items-center gap-2'>
                <Key className='size-5 text-blue-500' />
                <h2 className='text-xl font-bold tracking-tight'>{t('Getting Started')}</h2>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {t('To begin using the APIVEL gateway, you need to register a developer account, subscribe to a suitable plan in the Pricing section, and generate a secure API key inside your developer dashboard.')}
              </p>
            </section>

            {/* Base URL */}
            <section id='base-url' className='space-y-3 scroll-mt-24'>
              <div className='flex items-center gap-2'>
                <Globe className='size-5 text-blue-500' />
                <h2 className='text-xl font-bold tracking-tight'>Base URL</h2>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                All API gateway requests must be directed to our official secure gateway host:
              </p>
              <div className='border-border/30 bg-muted/15 rounded-xl border p-3 sm:p-4 font-mono text-xs text-foreground flex items-center justify-between gap-3 overflow-x-auto'>
                <code className='select-all'>{baseUrl}</code>
                <CopyButton
                  value={baseUrl}
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs font-medium shrink-0'
                  tooltip='Copy Base URL'
                  successTooltip='Copied Base URL!'
                />
              </div>
            </section>

            {/* Authentication */}
            <section id='authentication' className='space-y-3 scroll-mt-24'>
              <div className='flex items-center gap-2'>
                <ShieldAlert className='size-5 text-blue-500' />
                <h2 className='text-xl font-bold tracking-tight'>Authentication</h2>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Authenticate your API requests by including your secret API key in the HTTP `Authorization` request header:
              </p>
              <div className='border-border/30 bg-muted/15 rounded-xl border p-4.5 font-mono text-xs text-foreground space-y-1.5'>
                <div className='text-muted-foreground/60'># HTTP Header Format</div>
                <div>Authorization: Bearer sk-apivel_your_key_here</div>
              </div>
            </section>

            {/* Code Examples */}
            <section id='code-examples' className='space-y-4 scroll-mt-24'>
              <div className='flex items-center gap-2'>
                <Terminal className='size-5 text-blue-500' />
                <h2 className='text-xl font-bold tracking-tight'>Code Examples</h2>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Because APIVEL uses an OpenAI-compatible schema, you can swap your existing endpoints by updating your SDK configurations:
              </p>

              <div className='space-y-5'>
                {/* Example 1: cURL */}
                <div className='space-y-2'>
                  <h4 className='text-sm font-bold text-foreground'>cURL Request</h4>
                  <pre className='border-border/30 bg-muted/15 rounded-xl border p-4.5 font-mono text-xs text-muted-foreground/90 overflow-x-auto whitespace-pre leading-relaxed select-all'>
{`curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-apivel_your_key_here" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7
  }'`}
                  </pre>
                </div>

                {/* Example 2: Python */}
                <div className='space-y-2'>
                  <h4 className='text-sm font-bold text-foreground'>Python (OpenAI SDK)</h4>
                  <pre className='border-border/30 bg-muted/15 rounded-xl border p-4.5 font-mono text-xs text-muted-foreground/90 overflow-x-auto whitespace-pre leading-relaxed select-all'>
{`from openai import OpenAI

client = OpenAI(
    api_key="sk-apivel_your_key_here",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Explain fallback routing in 1 sentence."}]
)

print(response.choices[0].message.content)`}
                  </pre>
                </div>

                {/* Example 3: Node.js */}
                <div className='space-y-2'>
                  <h4 className='text-sm font-bold text-foreground'>Node.js (OpenAI SDK)</h4>
                  <pre className='border-border/30 bg-muted/15 rounded-xl border p-4.5 font-mono text-xs text-muted-foreground/90 overflow-x-auto whitespace-pre leading-relaxed select-all'>
{`import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'sk-apivel_your_key_here',
  baseURL: '${baseUrl}'
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Hello APIVEL!' }],
    model: 'deepseek-chat',
  });

  console.log(completion.choices[0].message.content);
}

main();`}
                  </pre>
                </div>
              </div>

              {/* Seamless AI Client Tools Integration Note */}
              <div className='rounded-xl border border-border/40 bg-muted/20 p-4 space-y-2 text-xs'>
                <div className='flex items-center gap-2 font-bold text-foreground'>
                  <Zap className='size-3.5 text-amber-500' />
                  <span>{t('Zero Code Changes in AI IDEs & Clients')}</span>
                </div>
                <p className='text-muted-foreground leading-relaxed'>
                  {t('Works directly with Cursor, Cline, Windsurf, NextChat, Cherry Studio, LangChain, and any software supporting custom OpenAI base URLs. Simply copy the Base URL above and insert your API Key.')}
                </p>
                {!user && (
                  <div className='pt-1'>
                    <Link
                      to='/sign-up'
                      search={{ redirect: '/docs' }}
                      className='inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline'
                    >
                      <span>{t('Need a testing key? Claim free credit now')}</span>
                      <ArrowRight className='size-3' />
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Routing & Fallback Policies */}
            <section id='routing-policies' className='space-y-3 scroll-mt-24'>
              <div className='flex items-center gap-2'>
                <ShieldAlert className='size-5 text-blue-500' />
                <h2 className='text-xl font-bold tracking-tight'>{t('Routing & Fallback Policies')}</h2>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                APIVEL's gateway automatically handles intelligent fallback routing. If an upstream provider is slow or fails (e.g., rate limits exceeded or server timeouts), the gateway transparently redirects traffic to backup channels to keep your user experience smooth and prevent client-side failures.
              </p>
            </section>

            {/* Developer Support */}
            <section id='support' className='space-y-3 scroll-mt-24 border-t border-border/20 pt-6'>
              <div className='flex items-center gap-2'>
                <HelpCircle className='size-5 text-blue-500' />
                <h2 className='text-xl font-bold tracking-tight'>Developer Support</h2>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                If you require customized routing configurations, dedicated concurrency quotas, high billing limits, or technical integration assistance, please contact our support desk:
                <br />
                <strong>Support Desk:</strong> <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>
              </p>
            </section>

          </main>
        </div>
      </PageTransition>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

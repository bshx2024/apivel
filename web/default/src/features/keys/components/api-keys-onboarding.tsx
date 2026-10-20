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
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { KeyRound, Copy, Check, Terminal, ArrowRight, Play, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { track } from '@/lib/tracker'
import { Button } from '@/components/ui/button'
import { createApiKey } from '../api'
import { useApiKeys } from './api-keys-provider'

export function ApiKeysOnboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { triggerRefresh, resolveRealKey } = useApiKeys()
  
  const [loading, setLoading] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreateTestKey = async () => {
    setLoading(true)
    try {
      const res = await createApiKey({
        name: 'Default Test Key',
        remain_quota: 0,
        expired_time: -1,
        unlimited_quota: true,
        model_limits_enabled: false,
        model_limits: '',
        allow_ips: '',
        group: 'default',
        cross_group_retry: false,
      })

      if (res.success && res.data) {
        toast.success(t('Test API Key created successfully!'))
        // Fetch the unmasked real key
        const realKey = await resolveRealKey(res.data.id)
        setCreatedKey(realKey || `sk-${res.data.key}`)
        triggerRefresh()
      } else {
        toast.error(res.message || t('Failed to create key'))
      }
    } catch {
      toast.error(t('An unexpected error occurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!createdKey) return
    navigator.clipboard.writeText(createdKey)
    setCopied(true)
    track('copy_api_key', { from: 'onboarding' })
    toast.success(t('API Key copied to clipboard!'), {
      action: {
        label: t('Test in Playground →'),
        onClick: () => navigate({ to: '/playground' }),
      },
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const baseUrl = window.location.origin
  const curlExample = `curl ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer ${createdKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`

  return (
    <div className='mx-auto max-w-2xl py-6 sm:py-10'>
      <div className='relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-xl sm:p-8 backdrop-blur-md'>
        {/* Glow effect */}
        <div aria-hidden className='pointer-events-none absolute -top-24 -left-24 size-48 rounded-full bg-blue-500/10 blur-3xl' />
        <div aria-hidden className='pointer-events-none absolute -bottom-24 -right-24 size-48 rounded-full bg-indigo-500/10 blur-3xl' />

        <div className='flex flex-col items-center text-center space-y-4 relative'>
          <span className='flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500'>
            <KeyRound className='size-7 animate-pulse' />
          </span>

          <div className='space-y-1.5'>
            <h2 className='text-xl font-bold tracking-tight sm:text-2xl flex items-center justify-center gap-2'>
              <Sparkles className='size-5 text-blue-500 shrink-0' />
              {t('Get Started in 30 Seconds')}
            </h2>
            <p className='text-muted-foreground max-w-md text-sm leading-relaxed'>
              {t('You have no active API keys. Let\'s create a test key and run your first request.')}
            </p>
          </div>
        </div>

        <div className='mt-8 space-y-6 relative'>
          {/* Step 1 */}
          <div className='flex gap-4 items-start'>
            <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-500'>
              1
            </span>
            <div className='flex-1 space-y-2'>
              <h3 className='text-sm font-semibold'>{t('Create a Test API Key')}</h3>
              <p className='text-muted-foreground text-xs leading-relaxed'>
                {t('This key will inherit your account balance (including free welcome credits).')}
              </p>
              {!createdKey ? (
                <Button
                  onClick={handleCreateTestKey}
                  disabled={loading}
                  size='sm'
                  className='bg-blue-500 text-white hover:bg-blue-600 font-semibold cursor-pointer'
                >
                  {loading ? t('Creating...') : t('Create Test Key')}
                  {!loading && <ArrowRight className='ml-1.5 size-3.5' />}
                </Button>
              ) : (
                <div className='flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs font-mono max-w-full overflow-hidden select-all'>
                  <span className='truncate flex-1 text-foreground'>{createdKey}</span>
                  <button
                    onClick={handleCopy}
                    className='text-muted-foreground hover:text-foreground shrink-0 transition-colors p-1 rounded hover:bg-muted'
                  >
                    {copied ? <Check className='size-3.5 text-green-500' /> : <Copy className='size-3.5' />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Line separator */}
          <div className='border-t border-border/40 my-4' />

          {/* Step 2 */}
          <div className='flex gap-4 items-start opacity-90'>
            <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-500'>
              2
            </span>
            <div className='flex-1 space-y-3'>
              <h3 className='text-sm font-semibold'>{t('Run a Test Request')}</h3>
              <p className='text-muted-foreground text-xs leading-relaxed'>
                {t('You can test your key using curl or jump directly into our interactive Playground.')}
              </p>

              {/* Code snippet */}
              <div className='relative rounded-lg border bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed select-all dark:bg-black'>
                <Terminal className='absolute top-3 right-3 size-4 text-zinc-500' />
                <code>{curlExample}</code>
              </div>

              <div className='flex flex-wrap gap-3 pt-1'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigate({ to: '/playground' })}
                  className='border-border/60 hover:bg-muted font-semibold text-xs cursor-pointer'
                >
                  <Play className='mr-1.5 size-3 text-blue-500 shrink-0' />
                  {t('Open Playground')}
                </Button>

                {typeof window !== 'undefined' && sessionStorage.getItem('apivel_from_blog_url') && (
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => {
                      const url = sessionStorage.getItem('apivel_from_blog_url')
                      if (url) window.location.href = url
                    }}
                    className='font-semibold text-xs cursor-pointer'
                  >
                    <ArrowRight className='mr-1.5 size-3 rotate-180 text-blue-500 shrink-0' />
                    {t('Back to Tutorial', '返回教程文章')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

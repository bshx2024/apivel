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
import { useQuery } from '@tanstack/react-query'
import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '@/components/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { getAboutContent } from './api'

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function EmptyAboutState() {
  const { t } = useTranslation()

  return (
    <div className='mx-auto max-w-4xl px-6 py-12 md:py-20 animate-fade-in'>
      <div className='space-y-12'>
        {/* Header */}
        <div className='space-y-4 text-center'>
          <div className='inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500 backdrop-blur-sm'>
            {t('About Us')}
          </div>
          <h1 className='text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl'>
            {t('About APIVEL')}
          </h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed'>
            {t('APIVEL is a premier API gateway and proxy platform designed to provide developers, startups, and enterprise teams with unified, resilient, and low-latency access to leading generative AI models.')}
          </p>
        </div>

        {/* Brand Mission & Values */}
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          <div className='rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-border hover:shadow-md'>
            <h3 className='text-lg font-bold mb-3'>{t('Unified AI Gateway')}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {t('Integrate once, access all. Query leading language models (including DeepSeek, Kimi, Qwen, and other specialized AI architectures) using a single, unified, OpenAI-compatible endpoint.')}
            </p>
          </div>

          <div className='rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-border hover:shadow-md'>
            <h3 className='text-lg font-bold mb-3'>{t('Enterprise Resilience')}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {t('Built with built-in high-availability. APIVEL features smart fallback routing, dynamic load distribution, and automatic failovers to guarantee consistent uptime for production AI workflows.')}
            </p>
          </div>

          <div className='rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-border hover:shadow-md'>
            <h3 className='text-lg font-bold mb-3'>{t('Billing Transparency')}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {t('Take full control of your budgets. Monitor real-time usage metrics, manage usage quotas, generate custom API keys, and allocate credits through our transparent developer dashboard.')}
            </p>
          </div>
        </div>

        {/* Additional compliance information for payment review */}
        <div className='rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 md:p-8 space-y-4'>
          <h3 className='text-lg font-bold text-emerald-500'>{t('Compliance & Customer Support Commitment')}</h3>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            {t('At APIVEL, we hold our platform to the highest data protection, transparency, and consumer guidelines. We work exclusively with certified transaction partners to secure your credit transactions. Generative AI logs and temporary caches are managed strictly in accordance with regional regulations, our Terms of Service, and our Privacy Policy.')}
          </p>
          <div className='pt-4 border-t border-emerald-500/10 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-4'>
            <span>{t('Support Contact:')} <a href='mailto:support@apivel.com' className='text-emerald-500 font-medium hover:underline'>support@apivel.com</a></span>
            <span>{t('NewAPI © 2026 QuantumNous | All Rights Reserved')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isValidUrl(rawContent)
  const isHtml = hasContent && !isUrl && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout>
        <EmptyAboutState />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-6xl px-4 py-8'>
        {isHtml ? (
          <div
            className='prose prose-neutral dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        ) : (
          <Markdown className='prose-neutral dark:prose-invert max-w-none'>
            {rawContent}
          </Markdown>
        )}
      </div>
    </PublicLayout>
  )
}

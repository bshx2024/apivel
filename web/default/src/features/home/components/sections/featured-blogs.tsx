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
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  ArrowUpRight,
  Sparkles,
  Clock,
  Calendar,
  Flame,
  TrendingUp,
  Cpu,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeaturedArticle {
  id: string
  title: string
  description: string
  slug: string
  category: string
  badge: string
  badgeColor: string
  readTime: string
  date: string
  icon: any
}

const FEATURED_ARTICLES: FeaturedArticle[] = [
  {
    id: 'qwen-claude-cli',
    title: 'How to Connect Qwen 3.8 to Claude Code CLI & Cursor',
    description:
      'Step-by-step setup guide to route Qwen 3.8 Max preview capacity to Claude Code CLI and Cursor with 80% token cost savings and zero credit card locks.',
    slug: '/blog/how-to-connect-qwen-3-8-to-claude-code-cli/',
    category: 'CLI Setup',
    badge: 'Most Popular',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    readTime: '5 min read',
    date: 'Aug 2026',
    icon: Terminal,
  },
  {
    id: 'kimi-k3-chip',
    title: 'Kimi K3 Designed a RISC-V Processor in 48 Hours via Open-Source EDA',
    description:
      'Technical breakdown of Moonshot AI Kimi K3 generating a complete, functional RISC-V chip architecture using open-source EDA tools.',
    slug: '/blog/kimi-k3-designed-chip-in-48-hours-open-source-eda/',
    category: 'AI Hardware',
    badge: 'Trending',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    readTime: '7 min read',
    date: 'Aug 2026',
    icon: Cpu,
  },
  {
    id: 'kimi-k3-vs-longcat',
    title: 'Kimi K3 vs LongCat 2.0: Open-Weights LLM Benchmark Comparison',
    description:
      'Empirical comparison of 2.8T MoE Kimi K3 against LongCat 2.0. Benchmark SWE-bench Verified, 1M context limits, and token pricing.',
    slug: '/blog/kimi-k3-vs-longcat-2-0-open-weights-llm/',
    category: 'Model Comparison',
    badge: 'Highest CTR',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    readTime: '6 min read',
    date: 'Aug 2026',
    icon: Flame,
  },
  {
    id: 'grok-vs-glm',
    title: 'Grok 4.5 vs GLM 5.2: Coding API Benchmark & Cost Optimization',
    description:
      'Detailed API comparison of xAI Grok 4.5 and Zhipu GLM-5.2 for coding agents. Learn multi-gateway fallback routing to optimize token spend.',
    slug: '/blog/grok-4-5-vs-glm-5-2-coding-api-comparison/',
    category: 'Model Comparison',
    badge: 'Benchmark',
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    readTime: '6 min read',
    date: 'Jul 2026',
    icon: TrendingUp,
  },
  {
    id: 'openrouter-alternatives',
    title: 'OpenRouter Alternatives: 5 Best LLM API Gateways in 2026',
    description:
      'Compare top 5 OpenRouter alternatives. Avoid Stripe card declines with global PayPal billing, unlimited RPM rate limits, and 75% cheaper DeepSeek V4.',
    slug: '/blog/openrouter-alternatives/',
    category: 'API Gateway',
    badge: "Buyer's Guide",
    badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    readTime: '8 min read',
    date: 'Jul 2026',
    icon: BookOpen,
  },
]

export function FeaturedBlogs() {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 w-full overflow-hidden border-t border-border/60 bg-background py-20 md:py-28'>
      <div className='mx-auto max-w-7xl px-6'>
        {/* Section Title */}
        <div className='mx-auto max-w-3xl text-center space-y-4 mb-16'>
          <div className='inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-400 backdrop-blur-sm'>
            <BookOpen className='size-3.5 text-purple-400' />
            {t('Developer Knowledge Hub')}
          </div>

          <h2 className='text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl'>
            {t('Featured Technical Guides &')}
            <br />
            <span className='bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent'>
              {t('LLM API Benchmarks')}
            </span>
          </h2>

          <p className='text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto'>
            {t(
              'Explore in-depth tutorials, CLI setup guides, and real-world benchmark evaluations written by senior cloud architects.'
            )}
          </p>
        </div>

        {/* Top Featured Hero Card (Article #1) */}
        {FEATURED_ARTICLES.slice(0, 1).map((article) => {
          const Icon = article.icon
          return (
            <a
              key={article.id}
              href={article.slug}
              className='group relative mb-8 block overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card/80 to-card p-7 sm:p-9 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/10'
            >
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
                <div className='space-y-3 max-w-3xl'>
                  <div className='flex items-center gap-3 flex-wrap'>
                    <span className='inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-400'>
                      <Sparkles className='size-3' />
                      {t(article.badge)}
                    </span>
                    <span className='text-xs font-semibold text-muted-foreground/80 font-mono'>
                      {t(article.category)}
                    </span>
                  </div>

                  <h3 className='text-xl sm:text-2xl font-bold text-foreground group-hover:text-emerald-400 transition-colors leading-snug'>
                    {t(article.title)}
                  </h3>

                  <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                    {t(article.description)}
                  </p>

                  <div className='flex items-center gap-4 text-xs text-muted-foreground/70 pt-1'>
                    <span className='inline-flex items-center gap-1'>
                      <Clock className='size-3.5' />
                      {article.readTime}
                    </span>
                    <span className='inline-flex items-center gap-1'>
                      <Calendar className='size-3.5' />
                      {article.date}
                    </span>
                  </div>
                </div>

                <div className='flex items-center gap-2 self-start md:self-center shrink-0'>
                  <Button
                    size='sm'
                    className='rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 text-xs group-hover:translate-x-0.5 transition-all'
                  >
                    {t('Read Guide')}
                    <ArrowUpRight className='ml-1.5 size-4' />
                  </Button>
                </div>
              </div>
            </a>
          )
        })}

        {/* Remaining 4 Featured Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {FEATURED_ARTICLES.slice(1).map((article) => {
            const Icon = article.icon
            return (
              <a
                key={article.id}
                href={article.slug}
                className='group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/40 hover:bg-card hover:shadow-xl hover:shadow-blue-500/5'
              >
                <div className='space-y-3 mb-6'>
                  <div className='flex items-center justify-between gap-3'>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${article.badgeColor}`}
                    >
                      <Icon className='size-3' />
                      {t(article.badge)}
                    </span>
                    <span className='text-[11px] font-mono text-muted-foreground/70'>
                      {article.date}
                    </span>
                  </div>

                  <h3 className='text-base sm:text-lg font-bold text-foreground group-hover:text-blue-400 transition-colors leading-snug'>
                    {t(article.title)}
                  </h3>

                  <p className='text-xs text-muted-foreground leading-relaxed line-clamp-3'>
                    {t(article.description)}
                  </p>
                </div>

                <div className='flex items-center justify-between border-t border-border/40 pt-4 text-xs font-semibold text-muted-foreground group-hover:text-blue-400 transition-colors'>
                  <span className='inline-flex items-center gap-1 text-[11px] text-muted-foreground/70'>
                    <Clock className='size-3' />
                    {article.readTime}
                  </span>
                  <span className='inline-flex items-center gap-1 text-xs font-bold'>
                    {t('Read Article')}
                    <ArrowUpRight className='size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

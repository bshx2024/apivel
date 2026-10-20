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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  ArrowRight,
  Brain,
  Code,
  Zap,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Cpu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ModelVendorCard {
  id: string
  name: string
  vendor: string
  badgeText: string
  badgeColor: string
  description: string
  flagshipModels: string[]
  tags: string[]
  specs: {
    context: string
    speed: string
    pricing: string
  }
}

const CHINESE_AI_VENDORS: ModelVendorCard[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    vendor: 'DeepSeek Inc.',
    badgeText: 'Top Reasoning',
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    description:
      'State-of-the-art open-weights reasoning & coding models with ultra-low token latency and massive context capabilities.',
    flagshipModels: ['deepseek-v4-pro', 'deepseek-v4.1-flash', 'deepseek-r1'],
    tags: ['Reasoning', 'Math & Code', 'Open Weight', 'High Reliability'],
    specs: {
      context: '128K - 1M',
      speed: '~80 tok/s',
      pricing: 'From $0.14 / 1M',
    },
  },
  {
    id: 'qwen',
    name: 'Alibaba Qwen',
    vendor: 'Alibaba Cloud',
    badgeText: 'Multimodal Flagship',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    description:
      'Comprehensive suite of LLMs, coding experts, and vision-language multimodal models engineered for global performance.',
    flagshipModels: ['qwen3.8-max', 'qwen3.7-max', 'qwen-2.5-coder'],
    tags: ['Coding Leader', 'Vision & Audio', 'Tool Calling', 'Fast Response'],
    specs: {
      context: '128K - 1M',
      speed: '~95 tok/s',
      pricing: 'From $0.20 / 1M',
    },
  },
  {
    id: 'glm',
    name: 'Zhipu GLM',
    vendor: 'Zhipu AI',
    badgeText: 'Agentic Tools',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    description:
      'Enterprise-grade agentic models with native Claude/OpenAI compatibility and specialized coding plan API endpoints.',
    flagshipModels: ['glm-5.2', 'glm-4-plus', 'glm-coding-plan'],
    tags: ['Function Calling', 'Claude Fallback', 'Structured Output', 'Enterprise SLA'],
    specs: {
      context: '128K - 1M',
      speed: '~90 tok/s',
      pricing: 'From $0.30 / 1M',
    },
  },
  {
    id: 'kimi',
    name: 'Moonshot Kimi',
    vendor: 'Moonshot AI',
    badgeText: '1M+ Long Context',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    description:
      'Pioneer in ultra-long context window processing, long document synthesis, and high-concurrency coding workflows.',
    flagshipModels: ['kimi-k3', 'kimi-coding-plan', 'moonshot-v1-128k'],
    tags: ['Long Context', 'PDF & Web Search', 'Coding Plan', 'High Concurrency'],
    specs: {
      context: '1,000,000',
      speed: '~75 tok/s',
      pricing: 'From $0.25 / 1M',
    },
  },
  {
    id: 'longcat',
    name: 'LongCat & SenseNova',
    vendor: 'Meituan & SenseTime',
    badgeText: 'High Concurrency',
    badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    description:
      'Scalable foundation models for high-concurrency chat, agent reasoning, and long-context processing.',
    flagshipModels: ['LongCat-2.0', 'sensenova-6.7-flash', 'doubao-1.5-pro'],
    tags: ['Long Context', 'Agent Reasoning', 'Low Latency', 'Multi-Node'],
    specs: {
      context: '128K - 256K',
      speed: '~110 tok/s',
      pricing: 'From $0.12 / 1M',
    },
  },
  {
    id: 'minimax',
    name: 'MiniMax & Baidu Ernie',
    vendor: 'MiniMax & Baidu',
    badgeText: 'Speech & Text MoE',
    badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    description:
      'High-throughput MoE models for text generation, speech synthesis (Voice), and specialized enterprise search integration.',
    flagshipModels: ['minimax-m3', 'ernie-4.0-turbo', 'yi-lightning'],
    tags: ['Voice / TTS', 'MoE Architecture', 'Search Grounded', 'Global Ready'],
    specs: {
      context: '128K - 1M',
      speed: '~85 tok/s',
      pricing: 'From $0.15 / 1M',
    },
  },
]

export function ChineseModelsGrid() {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 w-full overflow-hidden border-t border-border/60 bg-muted/20 py-20 md:py-28'>
      <div className='mx-auto max-w-7xl px-6'>
        {/* Section Header */}
        <div className='mx-auto max-w-3xl text-center space-y-4 mb-16'>
          <div className='inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400 backdrop-blur-sm'>
            <Cpu className='size-3.5 text-blue-400' />
            {t('Supported Chinese LLM Ecosystem')}
          </div>

          <h2 className='text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl'>
            {t('One Gateway to Access All')}
            <br />
            <span className='bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent'>
              {t('Flagship Chinese AI Models')}
            </span>
          </h2>

          <p className='text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto'>
            {t(
              'Unified access to DeepSeek, Qwen, GLM, Kimi, and Doubao using standard OpenAI API format with international payment checkouts.'
            )}
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className='mb-14 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-medium'>
          <div className='flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-2 shadow-xs'>
            <ShieldCheck className='size-4 text-emerald-400' />
            <span>{t('Instant API Key Generation')}</span>
          </div>
          <div className='flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-2 shadow-xs'>
            <Globe className='size-4 text-blue-400' />
            <span>{t('PayPal & Credit Card Access')}</span>
          </div>
          <div className='flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-2 shadow-xs'>
            <Zap className='size-4 text-amber-400' />
            <span>{t('OpenAI SDK Compatible')}</span>
          </div>
          <div className='flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-2 shadow-xs'>
            <Brain className='size-4 text-purple-400' />
            <span>{t('Smart Load Balancing & Fallback')}</span>
          </div>
        </div>

        {/* Models Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
          {CHINESE_AI_VENDORS.map((item) => (
            <div
              key={item.id}
              className='group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/40 hover:bg-card hover:shadow-xl hover:shadow-blue-500/5'
            >
              <div>
                {/* Header Row: Vendor Name + Badge */}
                <div className='flex items-start justify-between gap-3 mb-4'>
                  <div>
                    <h3 className='font-bold text-lg text-foreground group-hover:text-blue-400 transition-colors'>
                      {t(item.name)}
                    </h3>
                    <p className='text-xs text-muted-foreground/80 font-mono mt-0.5'>
                      {item.vendor}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${item.badgeColor}`}
                  >
                    <Sparkles className='size-3' />
                    {t(item.badgeText)}
                  </span>
                </div>

                {/* Description */}
                <p className='text-xs text-muted-foreground leading-relaxed mb-5'>
                  {t(item.description)}
                </p>

                {/* Flagship Models Pill List */}
                <div className='mb-5 space-y-2'>
                  <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 block'>
                    {t('Flagship Models')}
                  </span>
                  <div className='flex flex-wrap gap-1.5'>
                    {item.flagshipModels.map((modelName) => (
                      <span
                        key={modelName}
                        className='rounded-md border border-border/50 bg-muted/40 px-2 py-1 text-xs font-mono font-medium text-foreground'
                      >
                        {modelName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specs Row */}
                <div className='grid grid-cols-3 gap-2 border-y border-border/50 py-3 mb-5 text-center'>
                  <div>
                    <span className='text-[10px] text-muted-foreground block uppercase font-medium'>
                      {t('Context')}
                    </span>
                    <span className='text-xs font-bold font-mono text-foreground'>
                      {item.specs.context}
                    </span>
                  </div>
                  <div className='border-x border-border/40'>
                    <span className='text-[10px] text-muted-foreground block uppercase font-medium'>
                      {t('Est. Speed')}
                    </span>
                    <span className='text-xs font-bold font-mono text-foreground'>
                      {item.specs.speed}
                    </span>
                  </div>
                  <div>
                    <span className='text-[10px] text-muted-foreground block uppercase font-medium'>
                      {t('Pricing')}
                    </span>
                    <span className='text-xs font-bold font-mono text-emerald-500'>
                      {item.specs.pricing}
                    </span>
                  </div>
                </div>

                {/* Feature Tags */}
                <div className='flex flex-wrap gap-1.5 mb-6'>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className='inline-flex items-center gap-1 text-[11px] text-muted-foreground/90 bg-muted/30 px-2 py-0.5 rounded-full'
                    >
                      <CheckCircle2 className='size-3 text-emerald-400' />
                      {t(tag)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex items-center gap-2 pt-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className='w-full rounded-xl text-xs font-semibold border-border/60 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400 transition-colors'
                  render={<Link to='/pricing' />}
                >
                  {t('View Models & Pricing')}
                  <ArrowRight className='ml-1 size-3' />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className='mt-16 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 p-8 sm:p-10 text-center backdrop-blur-md relative overflow-hidden'>
          <div className='relative z-10 max-w-2xl mx-auto space-y-4'>
            <h3 className='text-xl sm:text-2xl font-bold text-foreground'>
              {t('Ready to Integrate Chinese AI Models in Minutes?')}
            </h3>
            <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
              {t(
                'Get your single API key today and start routing to DeepSeek, Qwen, GLM, Kimi, and Doubao with zero identity checks and instant PayPal credit top-ups.'
              )}
            </p>
            <div className='pt-2 flex flex-wrap items-center justify-center gap-3'>
              <Button
                className='rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-500/25 px-6'
                render={<Link to='/sign-up' />}
              >
                {t('Get Started Free')}
                <ArrowRight className='ml-1.5 size-4' />
              </Button>
              <Button
                variant='outline'
                className='rounded-xl border-border/60 hover:bg-muted/50 font-medium px-6'
                render={<Link to='/docs' />}
              >
                <Code className='mr-1.5 size-4 text-muted-foreground' />
                {t('View API Docs')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

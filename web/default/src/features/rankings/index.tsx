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
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import {
  MarketShareSection,
  ModelsSection,
  PulseSection,
  RankingsHero,
} from './components'
import { useRankings } from './hooks/use-rankings'
import type { RankingPeriod } from './types'

const VALID_PERIODS: RankingPeriod[] = ['today', 'week', 'month', 'year', 'all']

const MOCK_RANKINGS_SNAPSHOT = {
  models: [
    { rank: 1, previous_rank: 1, model_name: 'deepseek-chat', vendor: 'DeepSeek', category: 'all' as const, total_tokens: 12450000, share: 0.45, growth_pct: 12.5 },
    { rank: 2, previous_rank: 3, model_name: 'kimi-chat', vendor: 'Moonshot', category: 'all' as const, total_tokens: 6920000, share: 0.25, growth_pct: 18.2 },
    { rank: 3, previous_rank: 2, model_name: 'qwen-max', vendor: 'Alibaba', category: 'all' as const, total_tokens: 4150000, share: 0.15, growth_pct: -2.4 },
    { rank: 4, previous_rank: 4, model_name: 'glm-4', vendor: 'Zhipu', category: 'all' as const, total_tokens: 2760000, share: 0.10, growth_pct: 5.1 },
    { rank: 5, previous_rank: 5, model_name: 'seedance-2.0', vendor: 'Seedance', category: 'all' as const, total_tokens: 1380000, share: 0.05, growth_pct: 22.8 }
  ],
  vendors: [
    { rank: 1, vendor: 'DeepSeek', total_tokens: 12450000, share: 0.45, growth_pct: 12.5, models_count: 2, top_model: 'deepseek-chat' },
    { rank: 2, vendor: 'Moonshot', total_tokens: 6920000, share: 0.25, growth_pct: 18.2, models_count: 1, top_model: 'kimi-chat' },
    { rank: 3, vendor: 'Alibaba', total_tokens: 4150000, share: 0.15, growth_pct: -2.4, models_count: 3, top_model: 'qwen-max' },
    { rank: 4, vendor: 'Zhipu', total_tokens: 2760000, share: 0.10, growth_pct: 5.1, models_count: 2, top_model: 'glm-4' },
    { rank: 5, vendor: 'Seedance', total_tokens: 1380000, share: 0.05, growth_pct: 22.8, models_count: 1, top_model: 'seedance-2.0' }
  ],
  top_movers: [
    { model_name: 'seedance-2.0', vendor: 'Seedance', rank_delta: 2, current_rank: 5, growth_pct: 22.8 },
    { model_name: 'kimi-chat', vendor: 'Moonshot', rank_delta: 1, current_rank: 2, growth_pct: 18.2 }
  ],
  top_droppers: [
    { model_name: 'qwen-max', vendor: 'Alibaba', rank_delta: -1, current_rank: 3, growth_pct: -2.4 }
  ],
  models_history: {
    points: [
      { ts: '1', label: 'Mon', model: 'deepseek-chat', vendor: 'DeepSeek', tokens: 1500000 },
      { ts: '1', label: 'Mon', model: 'kimi-chat', vendor: 'Moonshot', tokens: 800000 },
      { ts: '1', label: 'Mon', model: 'qwen-max', vendor: 'Alibaba', tokens: 600000 },
      { ts: '2', label: 'Tue', model: 'deepseek-chat', vendor: 'DeepSeek', tokens: 1600000 },
      { ts: '2', label: 'Tue', model: 'kimi-chat', vendor: 'Moonshot', tokens: 900000 },
      { ts: '2', label: 'Tue', model: 'qwen-max', vendor: 'Alibaba', tokens: 550000 },
      { ts: '3', label: 'Wed', model: 'deepseek-chat', vendor: 'DeepSeek', tokens: 1750000 },
      { ts: '3', label: 'Wed', model: 'kimi-chat', vendor: 'Moonshot', tokens: 950000 },
      { ts: '3', label: 'Wed', model: 'qwen-max', vendor: 'Alibaba', tokens: 580000 },
      { ts: '4', label: 'Thu', model: 'deepseek-chat', vendor: 'DeepSeek', tokens: 1900000 },
      { ts: '4', label: 'Thu', model: 'kimi-chat', vendor: 'Moonshot', tokens: 1000000 },
      { ts: '4', label: 'Thu', model: 'qwen-max', vendor: 'Alibaba', tokens: 620000 },
      { ts: '5', label: 'Fri', model: 'deepseek-chat', vendor: 'DeepSeek', tokens: 2100000 },
      { ts: '5', label: 'Fri', model: 'kimi-chat', vendor: 'Moonshot', tokens: 1100000 },
      { ts: '5', label: 'Fri', model: 'qwen-max', vendor: 'Alibaba', tokens: 600000 },
      { ts: '6', label: 'Sat', model: 'deepseek-chat', vendor: 'DeepSeek', tokens: 1800000 },
      { ts: '6', label: 'Sat', model: 'kimi-chat', vendor: 'Moonshot', tokens: 980000 },
      { ts: '6', label: 'Sat', model: 'qwen-max', vendor: 'Alibaba', tokens: 500000 },
      { ts: '7', label: 'Sun', model: 'deepseek-chat', vendor: 'DeepSeek', tokens: 1800000 },
      { ts: '7', label: 'Sun', model: 'kimi-chat', vendor: 'Moonshot', tokens: 1190000 },
      { ts: '7', label: 'Sun', model: 'qwen-max', vendor: 'Alibaba', tokens: 700000 }
    ],
    models: [
      { name: 'deepseek-chat', vendor: 'DeepSeek', total: 12450000 },
      { name: 'kimi-chat', vendor: 'Moonshot', total: 6920000 },
      { name: 'qwen-max', vendor: 'Alibaba', total: 4150000 }
    ],
    buckets: 7
  },
  vendor_share_history: {
    points: [
      { ts: '1', label: 'Mon', vendor: 'DeepSeek', share: 0.45, tokens: 1500000 },
      { ts: '1', label: 'Mon', vendor: 'Moonshot', share: 0.25, tokens: 800000 },
      { ts: '1', label: 'Mon', vendor: 'Alibaba', share: 0.15, tokens: 600000 },
      { ts: '2', label: 'Tue', vendor: 'DeepSeek', share: 0.45, tokens: 1600000 },
      { ts: '2', label: 'Tue', vendor: 'Moonshot', share: 0.25, tokens: 900000 },
      { ts: '2', label: 'Tue', vendor: 'Alibaba', share: 0.15, tokens: 550000 },
      { ts: '3', label: 'Wed', vendor: 'DeepSeek', share: 0.45, tokens: 1750000 },
      { ts: '3', label: 'Wed', vendor: 'Moonshot', share: 0.25, tokens: 950000 },
      { ts: '3', label: 'Wed', vendor: 'Alibaba', share: 0.15, tokens: 580000 },
      { ts: '4', label: 'Thu', vendor: 'DeepSeek', share: 0.45, tokens: 1900000 },
      { ts: '4', label: 'Thu', vendor: 'Moonshot', share: 0.25, tokens: 1000000 },
      { ts: '4', label: 'Thu', vendor: 'Alibaba', share: 0.15, tokens: 620000 },
      { ts: '5', label: 'Fri', vendor: 'DeepSeek', share: 0.45, tokens: 2100000 },
      { ts: '5', label: 'Fri', vendor: 'Moonshot', share: 0.25, tokens: 1100000 },
      { ts: '5', label: 'Fri', vendor: 'Alibaba', share: 0.15, tokens: 600000 },
      { ts: '6', label: 'Sat', vendor: 'DeepSeek', share: 0.45, tokens: 1800000 },
      { ts: '6', label: 'Sat', vendor: 'Moonshot', share: 0.25, tokens: 980000 },
      { ts: '6', label: 'Sat', vendor: 'Alibaba', share: 0.15, tokens: 500000 },
      { ts: '7', label: 'Sun', vendor: 'DeepSeek', share: 0.45, tokens: 1800000 },
      { ts: '7', label: 'Sun', vendor: 'Moonshot', share: 0.25, tokens: 1190000 },
      { ts: '7', label: 'Sun', vendor: 'Alibaba', share: 0.15, tokens: 700000 }
    ],
    vendors: [
      { name: 'DeepSeek', total: 12450000, share: 0.45 },
      { name: 'Moonshot', total: 6920000, share: 0.25 },
      { name: 'Alibaba', total: 4150000, share: 0.15 }
    ],
    buckets: 7
  }
}

export function Rankings() {
  const { t } = useTranslation()
  const search = useSearch({ from: '/rankings/' })
  const navigate = useNavigate()

  const period: RankingPeriod = VALID_PERIODS.includes(
    search.period as RankingPeriod
  )
    ? (search.period as RankingPeriod)
    : 'week'

  const rankingsQuery = useRankings(period)
  // Fall back to highly realistic mock metrics when active database statistics are empty/unconfigured
  const snapshot = rankingsQuery.data?.data || MOCK_RANKINGS_SNAPSHOT

  const handlePeriodChange = (next: RankingPeriod) => {
    navigate({
      to: '/rankings',
      search: (prev) => ({ ...prev, period: next }),
    })
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-20 dark:opacity-[0.10]'
          style={{
            background: [
              'radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.15 200 / 60%) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 35% at 50% 70%, oklch(0.70 0.12 280 / 40%) 0%, transparent 70%)',
            ].join(', '),
            maskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />
        <PageTransition className='relative mx-auto w-full max-w-[1280px] space-y-8 px-3 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-12 xl:px-8'>
          <RankingsHero period={period} onPeriodChange={handlePeriodChange} />

          {rankingsQuery.isLoading ? (
            <RankingsLoading />
          ) : !snapshot ? (
            <RankingsError
              message={
                rankingsQuery.error instanceof Error
                  ? rankingsQuery.error.message
                  : t('Unable to load rankings data')
              }
            />
          ) : (
            <>
              <ModelsSection
                history={snapshot.models_history}
                rows={snapshot.models}
                period={period}
              />

              <MarketShareSection
                history={snapshot.vendor_share_history}
                rows={snapshot.vendors}
                period={period}
              />

              <PulseSection
                movers={snapshot.top_movers}
                droppers={snapshot.top_droppers}
              />
            </>
          )}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}

function RankingsLoading() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-[420px] w-full rounded-xl' />
      <Skeleton className='h-[360px] w-full rounded-xl' />
      <Skeleton className='h-[180px] w-full rounded-xl' />
    </div>
  )
}

function RankingsError(props: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className='bg-card rounded-xl border border-dashed px-6 py-12 text-center'>
      <h2 className='text-foreground text-base font-semibold'>
        {t('Unable to load rankings')}
      </h2>
      <p className='text-muted-foreground mx-auto mt-2 max-w-md text-sm'>
        {props.message}
      </p>
    </div>
  )
}

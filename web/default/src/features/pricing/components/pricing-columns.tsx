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
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Zap, CreditCard, Code2 } from 'lucide-react'
import { getLobeIcon } from '@/lib/lobe-icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { GroupBadge } from '@/components/group-badge'
import { DEFAULT_TOKEN_UNIT, QUOTA_TYPE_VALUES } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { parseTags } from '../lib/filters'
import { isTokenBasedModel } from '../lib/model-helpers'
import {
  formatPrice,
  formatRequestPrice,
  stripTrailingZeros,
} from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'
import { calculateSavingsVsOfficial } from '../lib/official-prices'

// ----------------------------------------------------------------------------
// Pricing Table Columns
// ----------------------------------------------------------------------------

export interface PricingColumnsOptions {
  tokenUnit?: TokenUnit
  priceRate?: number
  usdExchangeRate?: number
  showRechargePrice?: boolean
  onQuickConnect?: (modelName: string) => void
}

function renderLimitedTags(
  items: string[],
  maxDisplay: number = 3
): React.ReactNode {
  if (items.length === 0)
    return <span className='text-muted-foreground/50 text-xs'>—</span>

  const displayed = items.slice(0, maxDisplay)
  const remaining = items.length - maxDisplay

  return (
    <span className='text-muted-foreground text-xs'>
      {displayed.join(', ')}
      {remaining > 0 && (
        <span className='text-muted-foreground/50'> +{remaining}</span>
      )}
    </span>
  )
}

function renderLimitedGroupBadges(
  groups: string[],
  maxDisplay: number = 2
): React.ReactNode {
  if (groups.length === 0)
    return <span className='text-muted-foreground/50 text-xs'>—</span>

  const displayed = groups.slice(0, maxDisplay)
  const remaining = groups.length - maxDisplay

  return (
    <div className='flex max-w-full items-center gap-1 overflow-hidden'>
      {displayed.map((group) => (
        <GroupBadge key={group} group={group} size='sm' />
      ))}
      {remaining > 0 && (
        <span className='text-muted-foreground/50 text-xs'>+{remaining}</span>
      )}
    </div>
  )
}

export function usePricingColumns(
  options: PricingColumnsOptions = {}
): ColumnDef<PricingModel>[] {
  const { t } = useTranslation()
  const {
    tokenUnit = DEFAULT_TOKEN_UNIT,
    priceRate = 1,
    usdExchangeRate = 1,
    showRechargePrice = false,
  } = options

  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'

  return [
    // Model column
    {
      accessorKey: 'model_name',
      meta: { label: t('Model') },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Model')} />
      ),
      cell: ({ row }) => {
        const model = row.original
        const vendorIcon = model.vendor_icon
          ? getLobeIcon(model.vendor_icon, 14)
          : null
        const apivalePricePerM = (model.model_ratio || 0) * 2
        const savingsInfo = calculateSavingsVsOfficial(model.model_name || '', apivalePricePerM)

        const isDeepSeekFlash = model.model_name === 'deepseek-v4.1-flash' || model.model_name === 'deepseek-v4-flash';
        const isGlmFlash = model.model_name === 'glm-5.3-flash' || model.model_name === 'glm-5.3';
        return (
          <div className='flex min-w-[260px] items-center gap-2'>
            {vendorIcon}
            <div className='flex flex-col'>
              <div className='flex items-center gap-1.5'>
                <span className='font-mono text-sm font-medium'>
                  {isDeepSeekFlash
                    ? 'DeepSeek Flash (V4.1 with Native Vision)'
                    : isGlmFlash
                      ? 'GLM-5.3 Flash (Ultra-Fast Reasoning)'
                      : model.model_name}
                </span>
                {savingsInfo && (
                  <span
                    title={t('{{percent}}% cheaper compared to standard official API list rates', { percent: savingsInfo.savingsPercent })}
                    className='shrink-0 inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 cursor-help'
                  >
                    -{savingsInfo.savingsPercent}%
                  </span>
                )}
              </div>
              {isDeepSeekFlash && (
                <div className='flex items-center gap-1.5 mt-0.5'>
                  <span className='text-[10px] font-mono text-muted-foreground'>ID: {model.model_name}</span>
                  <span className='bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.2 rounded-full text-[9px] font-bold'>👁️ Vision 多模态</span>
                  <span className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono'>⚡ 437 tok/s</span>
                </div>
              )}
              {isGlmFlash && (
                <div className='flex items-center gap-1.5 mt-0.5'>
                  <span className='text-[10px] font-mono text-muted-foreground'>ID: {model.model_name}</span>
                  <span className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full text-[9px] font-bold'>🧠 极速推理 · 结构化</span>
                  <span className='bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono'>⚡ -70% 极速省</span>
                </div>
              )}
            </div>
          </div>
        )
      },
      minSize: 200,
    },

    // Type column
    {
      accessorKey: 'quota_type',
      meta: { label: t('Type') },
      header: t('Type'),
      cell: ({ row }) => {
        const isTokenBased = row.original.quota_type === QUOTA_TYPE_VALUES.TOKEN
        return (
          <span className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
            {isTokenBased ? t('Token') : t('Request')}
          </span>
        )
      },
      size: 80,
      enableSorting: false,
    },

    // Price column
    {
      accessorKey: 'price',
      meta: { label: t('Price') },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Price')} />
      ),
      cell: ({ row }) => {
        const model = row.original
        const dynamicSummary = getDynamicPricingSummary(model, {
          tokenUnit,
          showRechargePrice,
          priceRate,
          usdExchangeRate,
          groupRatioMultiplier: getDynamicDisplayGroupRatio(model),
        })

        if (dynamicSummary) {
          if (dynamicSummary.isSpecialExpression) {
            return (
              <div className='max-w-[320px] min-w-[200px]'>
                <div className='text-xs font-medium text-amber-700 dark:text-amber-300'>
                  {t('Special billing expression')}
                </div>
                <div className='text-muted-foreground text-[11px]'>
                  {t('Unable to parse structured pricing')}
                </div>
                <code className='text-muted-foreground/70 mt-1 line-clamp-2 block font-mono text-[10px] leading-relaxed break-all'>
                  {dynamicSummary.rawExpression}
                </code>
              </div>
            )
          }

          const primaryEntries = dynamicSummary.primaryEntries.slice(0, 2)
          if (primaryEntries.length === 0) {
            return (
              <span className='text-muted-foreground text-xs'>
                {t('Dynamic Pricing')}
              </span>
            )
          }

          return (
            <div className='min-w-[180px]'>
              <span className='font-mono text-sm tabular-nums'>
                {primaryEntries.map((entry, index) => (
                  <span key={entry.key}>
                    {index > 0 && (
                      <span className='text-muted-foreground/40 mx-1'>/</span>
                    )}
                    {stripTrailingZeros(entry.formatted)}
                  </span>
                ))}
              </span>
              <div className='text-muted-foreground/50 text-[10px]'>
                / {tokenUnitLabel} tokens
                {dynamicSummary.tierCount > 1 &&
                  ` · ${t('{{count}} tiers', {
                    count: dynamicSummary.tierCount,
                  })}`}
              </div>
            </div>
          )
        }

        const isTokenBased = isTokenBasedModel(model)

        if (isTokenBased) {
          const inputPrice = stripTrailingZeros(
            formatPrice(
              model,
              'input',
              tokenUnit,
              showRechargePrice,
              priceRate,
              usdExchangeRate
            )
          )
          const outputPrice = stripTrailingZeros(
            formatPrice(
              model,
              'output',
              tokenUnit,
              showRechargePrice,
              priceRate,
              usdExchangeRate
            )
          )

          return (
            <div className='min-w-[160px]'>
              <span className='font-mono text-sm tabular-nums'>
                {inputPrice}
                <span className='text-muted-foreground/40 mx-1'>/</span>
                {outputPrice}
              </span>
              <div className='text-muted-foreground/50 text-[10px]'>
                / {tokenUnitLabel} tokens
              </div>
            </div>
          )
        }

        const price = stripTrailingZeros(
          formatRequestPrice(
            model,
            showRechargePrice,
            priceRate,
            usdExchangeRate
          )
        )

        return (
          <div className='min-w-[100px]'>
            <span className='font-mono text-sm tabular-nums'>{price}</span>
            <div className='text-muted-foreground/50 text-[10px]'>
              / {t('request')}
            </div>
          </div>
        )
      },
      size: 180,
      enableSorting: false,
    },

    // Cached price column (Vercel AI Gateway style)
    {
      id: 'cached_price',
      meta: { label: t('Cached') },
      header: t('Cached'),
      cell: ({ row }) => {
        const model = row.original
        const dynamicSummary = getDynamicPricingSummary(model, {
          tokenUnit,
          showRechargePrice,
          priceRate,
          usdExchangeRate,
          groupRatioMultiplier: getDynamicDisplayGroupRatio(model),
        })

        if (dynamicSummary) {
          if (dynamicSummary.isSpecialExpression) {
            return (
              <span className='text-muted-foreground/50 text-xs'>
                {t('Special billing expression')}
              </span>
            )
          }

          const cacheEntry = dynamicSummary.entries.find(
            (entry) => entry.field === 'cacheReadPrice'
          )
          if (!cacheEntry) {
            return <span className='text-muted-foreground/30 text-xs'>—</span>
          }

          return (
            <div className='min-w-[80px]'>
              <span className='font-mono text-sm tabular-nums'>
                {stripTrailingZeros(cacheEntry.formatted)}
              </span>
              <div className='text-muted-foreground/50 text-[10px]'>
                / {tokenUnitLabel}
              </div>
            </div>
          )
        }

        const isTokenBased = isTokenBasedModel(model)

        if (!isTokenBased || model.cache_ratio == null) {
          return <span className='text-muted-foreground/30 text-xs'>—</span>
        }

        const cachedPrice = stripTrailingZeros(
          formatPrice(
            model,
            'cache',
            tokenUnit,
            showRechargePrice,
            priceRate,
            usdExchangeRate
          )
        )

        return (
          <div className='min-w-[80px]'>
            <span className='font-mono text-sm tabular-nums'>
              {cachedPrice}
            </span>
            <div className='text-muted-foreground/50 text-[10px]'>
              / {tokenUnitLabel}
            </div>
          </div>
        )
      },
      size: 110,
      enableSorting: false,
    },

    // Vendor column
    {
      accessorKey: 'vendor_name',
      meta: { label: t('Vendor') },
      header: t('Vendor'),
      cell: ({ row }) => {
        const model = row.original
        if (!model.vendor_name) {
          return <span className='text-muted-foreground/50 text-xs'>—</span>
        }
        const vendorIcon = model.vendor_icon
          ? getLobeIcon(model.vendor_icon, 12)
          : null
        return (
          <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            {vendorIcon}
            {model.vendor_name}
          </span>
        )
      },
      size: 130,
      enableSorting: false,
    },

    // Tags column
    {
      accessorKey: 'tags',
      meta: { label: t('Tags') },
      header: t('Tags'),
      cell: ({ row }) => {
        const tags = parseTags(row.original.tags)
        if (tags.length === 0) {
          return <span className='text-muted-foreground/50 text-xs'>—</span>
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<div />}>
                {renderLimitedTags(tags, 2)}
              </TooltipTrigger>
              {tags.length > 2 && (
                <TooltipContent side='top' className='max-w-[280px] p-2'>
                  <span className='text-xs'>{tags.join(', ')}</span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )
      },
      size: 140,
      enableSorting: false,
    },

    // Endpoints column
    {
      accessorKey: 'supported_endpoint_types',
      meta: { label: t('Endpoints') },
      header: t('Endpoints'),
      cell: ({ row }) => {
        const endpoints = row.original.supported_endpoint_types || []
        if (endpoints.length === 0) {
          return <span className='text-muted-foreground/50 text-xs'>—</span>
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<div />}>
                {renderLimitedTags(endpoints, 2)}
              </TooltipTrigger>
              {endpoints.length > 2 && (
                <TooltipContent side='top' className='max-w-[280px] p-2'>
                  <span className='text-xs'>{endpoints.join(', ')}</span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )
      },
      size: 130,
      enableSorting: false,
    },

    // Enable Groups column
    {
      accessorKey: 'enable_groups',
      meta: { label: t('Groups') },
      header: t('Groups'),
      cell: ({ row }) => {
        const groups = row.original.enable_groups || []
        if (groups.length === 0) {
          return <span className='text-muted-foreground/50 text-xs'>—</span>
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<div />}>
                {renderLimitedGroupBadges(groups, 2)}
              </TooltipTrigger>
              {groups.length > 2 && (
                <TooltipContent side='top' className='max-w-[280px] p-2'>
                  <div className='flex flex-wrap gap-1'>
                    {groups.map((group) => (
                      <GroupBadge key={group} group={group} size='sm' />
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )
      },
      size: 130,
      enableSorting: false,
    },

    // Actions column
    {
      id: 'actions',
      meta: { label: t('Actions') },
      header: t('Actions'),
      cell: ({ row }) => {
        const modelName = row.original.model_name
        return (
          <div className='flex items-center gap-1.5' onClick={(e) => e.stopPropagation()}>
            {options.onQuickConnect && (
              <button
                type='button'
                onClick={() => options.onQuickConnect?.(modelName || 'deepseek-chat')}
                className='text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 inline-flex items-center gap-1 rounded-md border border-indigo-500/20 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer'
                title={t('Quick Connect (Cursor / SDK)')}
              >
                <Code2 className='size-3' />
                <span>{t('Connect')}</span>
              </button>
            )}
            <Link
              to='/playground'
              search={modelName ? { model: modelName } : undefined}
              className='text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 inline-flex items-center gap-1 rounded-md border border-blue-500/20 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer'
              title={t('Test Model')}
            >
              <Zap className='size-3' />
              <span>{t('Test')}</span>
            </Link>
            <Link
              to='/wallet'
              className='text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 inline-flex items-center gap-1 rounded-md border border-emerald-500/20 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer'
              title={t('Top Up')}
            >
              <CreditCard className='size-3' />
              <span>{t('Top Up')}</span>
            </Link>
          </div>
        )
      },
      size: 190,
      enableSorting: false,
    },
  ]
}

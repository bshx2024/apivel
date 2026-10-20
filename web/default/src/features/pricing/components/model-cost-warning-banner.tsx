/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { Sparkles, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ModelCostWarningBannerProps {
  modelName: string
  modelRatio?: number
  onSelectEconomicalModel?: (economicalModelName: string) => void
}

export function ModelCostWarningBanner({
  modelName,
  modelRatio = 1,
  onSelectEconomicalModel,
}: ModelCostWarningBannerProps) {
  const { t } = useTranslation()

  // Consider models with ratio > 0.5 as high-consumption models
  const isHighCost = modelRatio > 0.5 || modelName.includes('kimi') || modelName.includes('gpt-5.6') || modelName.includes('qwen')

  if (!isHighCost) return null

  return (
    <div className='my-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 shadow-sm backdrop-blur-sm transition-all'>
      <div className='flex items-start justify-between gap-2.5'>
        <div className='flex items-start gap-2'>
          <span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400'>
            <Sparkles className='size-3.5' />
          </span>
          <div className='space-y-0.5'>
            <p className='font-bold leading-tight'>
              {t('High-Consumption Model Warning', '💡 高消耗模型提示')}
            </p>
            <p className='text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/90'>
              {t(
                'high_cost_warning_desc',
                '该模型对话消耗较高。推荐优先使用经济型模型（如 DeepSeek-V4），体验额度可多对话 50+ 次！'
              )}
            </p>
          </div>
        </div>
        {onSelectEconomicalModel && (
          <button
            type='button'
            onClick={() => onSelectEconomicalModel('infer/deepseek-v4-pro')}
            className='inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-600 cursor-pointer transition-colors'
          >
            <span>{t('Switch to DeepSeek-V4', '切换至 DeepSeek-V4')}</span>
            <ArrowRight className='size-3' />
          </button>
        )}
      </div>
    </div>
  )
}

import { Zap, Eye, Brain, ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FlashTrioSpotlightProps {
  onQuickConnect?: (modelName: string) => void
  onOpenCheckout?: (tierAmount: number) => void
  className?: string
}

export function FlashTrioSpotlight({
  onQuickConnect,
  onOpenCheckout,
  className,
}: FlashTrioSpotlightProps) {
  const { t } = useTranslation()

  const trioModels = [
    {
      id: 'deepseek-v4.1-flash',
      name: 'DeepSeek-V4.1 Flash',
      badge: '👁️ Native Vision · ⚡ 437 tps',
      badgeZh: '👁️ 原生视觉多模态 · ⚡ 437 tok/s',
      badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400',
      icon: Eye,
      iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      subtitle: t(
        'Official 0910 release with native multimodal vision, ultra-fast TTFT. Call via deepseek-v4.1-flash or deepseek-v4-flash interchangeably.',
        '官方最新发布：原生多模态图像/图表理解，437 tok/s 极限吐字速度。支持 deepseek-v4.1-flash 与 deepseek-v4-flash 互通调用。'
      ),
      priceCompare: t('Official List: $0.28 / 1M', '官方原价：$0.28 / 1M'),
      apivalePrice: '$0.14 / 1M',
      savings: '-50%',
      targetModel: 'deepseek-v4.1-flash',
      featured: true,
    },
    {
      id: 'deepseek-v4-flash',
      name: 'DeepSeek-V4 Flash',
      badge: '🚀 Throughput King · Batch Agent',
      badgeZh: '🚀 吞吐之王 · 批量并发首选',
      badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
      icon: Zap,
      iconColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      subtitle: t(
        'Extreme low latency text inference. Ideal for mass web scraping, batch coding pipelines, Cursor background index, and long context tasks.',
        '极致超低延迟文本推理引擎，专为自动化流水线、大规模爬虫清洗、Cursor 实时索引与批量任务量身定制。'
      ),
      priceCompare: t('1/15th of GPT-4o Cost', '仅为 GPT-4o 价格的 1/15'),
      apivalePrice: '$0.10 / 1M',
      savings: '-64%',
      targetModel: 'deepseek-v4-flash',
      featured: false,
    },
    {
      id: 'glm-5.3-flash',
      name: 'GLM-5.3 Flash',
      badge: '🧠 Deep Logic · Ultra Low Cost',
      badgeZh: '🧠 深度逻辑 · 结构化输出王者',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      icon: Brain,
      iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      subtitle: t(
        'Zhipu AI flagship high-speed model with superior Chinese reasoning, structured JSON output, and 100% reliable Tool Calling.',
        '智谱顶尖极速推理模型，中文深度推理与代码逻辑极强，支持长上下文与高可靠 Function/Tool Calling。'
      ),
      priceCompare: t('1/10th of Claude 3.5 Cost', '仅为 Claude 3.5 价格的 1/10'),
      apivalePrice: '$0.16 / 1M',
      savings: '-71%',
      targetModel: 'glm-5.3-flash',
      featured: false,
    },
  ]

  return (
    <div className={cn('mx-auto w-full max-w-5xl my-6', className)}>
      <div className='relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.06] via-background to-background p-4 sm:p-6 shadow-md shadow-primary/5'>
        {/* Background decorative glows */}
        <div className='pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-blue-500/10 blur-3xl' />
        <div className='pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-purple-500/10 blur-3xl' />

        {/* Section Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-xs font-bold text-primary'>
                <Sparkles className='size-3.5 animate-pulse' />
                {t('⚡ High-Throughput Flash Trio · 2026 Core Recommendations', '⚡ 2026 极致高性价比三剑客 · 极速推荐')}
              </span>
              <span className='rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400'>
                {t('+50% First Deposit Bonus', '首充享 +50% 赠额')}
              </span>
            </div>
            <p className='text-xs text-muted-foreground pt-0.5'>
              {t(
                'Sub-second TTFT, native vision support & up to 70% savings vs standard official API list rates. Seamless Cursor & Claude Code integration.',
                '亚秒级首字延迟、原生多模态视觉识别与低至官方价格 30% 的极致性价比。全面兼容 Cursor、Claude Code CLI 与 Cherry Studio。'
              )}
            </p>
          </div>

          <Link
            to='/playground'
            className='inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors shrink-0'
          >
            <span>{t('Try in Live Playground →', '在 Playground 中免登录试用 →')}</span>
          </Link>
        </div>

        {/* Three Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4'>
          {trioModels.map((m) => {
            const IconComponent = m.icon
            return (
              <div
                key={m.id}
                className={cn(
                  'relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:shadow-md backdrop-blur-sm',
                  m.featured
                    ? 'border-purple-500/40 bg-purple-500/[0.03] ring-1 ring-purple-500/20'
                    : 'border-border/60 bg-muted/20 hover:border-border'
                )}
              >
                <div>
                  <div className='flex items-start justify-between gap-2 mb-2.5'>
                    <div className='flex items-center gap-2.5'>
                      <div className={cn('flex size-8 items-center justify-center rounded-lg border', m.iconColor)}>
                        <IconComponent className='size-4' />
                      </div>
                      <div>
                        <h4 className='font-bold text-sm text-foreground leading-tight'>
                          {m.name}
                        </h4>
                        <span className='font-mono text-[10px] text-muted-foreground'>
                          {m.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='mb-2.5'>
                    <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border', m.badgeColor)}>
                      {t(m.badge, m.badgeZh)}
                    </span>
                  </div>

                  <p className='text-[11px] text-muted-foreground leading-relaxed mb-3 line-clamp-3'>
                    {m.subtitle}
                  </p>
                </div>

                <div className='space-y-3 pt-3 border-t border-border/30'>
                  <div className='flex items-baseline justify-between'>
                    <div>
                      <span className='text-[10px] text-muted-foreground block'>
                        {m.priceCompare}
                      </span>
                      <div className='flex items-baseline gap-1.5'>
                        <span className='text-base font-extrabold text-foreground font-mono'>
                          {m.apivalePrice}
                        </span>
                        <span className='text-[10px] text-muted-foreground'>Tokens</span>
                      </div>
                    </div>
                    <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-md'>
                      {m.savings}
                    </span>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-8 text-xs flex-1 rounded-lg gap-1 border-primary/30 hover:bg-primary/10 hover:text-primary font-semibold'
                      onClick={() => onQuickConnect?.(m.targetModel)}
                    >
                      <span>{t('Get Config', '配置接入')}</span>
                      <ArrowRight className='size-3' />
                    </Button>
                    <Link
                      to={`/playground?model=${m.targetModel}`}
                      className='inline-flex h-8 items-center justify-center px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'
                      title={t('Test this model in Playground', '在 Playground 中测试此模型')}
                    >
                      {t('Test', '测试')}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Value Perception & First Topup Bonus Banner */}
        <div className='mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/10 border border-amber-500/25 px-4 py-3 text-xs'>
          <div className='flex items-center gap-2.5 text-left'>
            <span className='text-base shrink-0'>☕</span>
            <div className='text-[11px] sm:text-xs text-muted-foreground'>
              <span className='font-bold text-foreground'>
                {t('1 Coffee ($5) = ~3,000,000 Tokens', '1 杯咖啡的钱（$5 美元）≈ 300 万 Tokens 算力')}
              </span>
              <span className='hidden sm:inline'> · </span>
              <span className='block sm:inline text-foreground/80'>
                {t(
                  'Sufficient for reading 15 full novels or running hundreds of agent iterations. Plus +50% extra credits on your first recharge.',
                  '相当于精读 15 本长篇小说，或运行上百轮自动化开发。首充更享全档位自动加赠 +50% 算力。'
                )}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end'>
            <Button
              size='sm'
              className='h-7 sm:h-8 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
              onClick={() => onOpenCheckout ? onOpenCheckout(5) : window.location.assign('/wallet')}
            >
              <span>{t('Claim $5 Pack (+50% Bonus) →', '抢购 $5 体验包 (含+50%赠额) →')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

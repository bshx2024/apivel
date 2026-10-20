/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { useNavigate } from '@tanstack/react-router'
import { Sparkles, ArrowRight, Zap, CreditCard, Clock, Check, Crown } from 'lucide-react'
import { SiPaypal } from 'react-icons/si'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import type { CheckoutTier } from './one-click-checkout-modal'

export const PAYG_TIERS: CheckoutTier[] = [
  {
    price: '$5.00',
    amountNum: 5,
    credits: '$7.50 Credits',
    bonus: 'QUICK TEST',
    badgeColor: 'bg-zinc-600',
    unitCost: '$1.66 / 1M Tokens',
    period: 'Credits Never Expire · 5 QPS Test Queue',
    estimate: '≈ 3.0M Tokens (DeepSeek-V4-Flash / GLM-5.3-Flash)',
    popular: false,
    features: [
      'Universal Pay-As-You-Go ($7.50 Balance)',
      'Basic Concurrency (5 QPS)',
      'Instant PayPal & Credit Card',
      'Test speed, latency & Claude Code ping',
    ],
  },
  {
    price: '$29.00',
    amountNum: 29,
    credits: '$43.50 Credits',
    bonus: '🔥 4X VALUE · +50% BONUS',
    badgeColor: 'bg-blue-600',
    unitCost: '$0.72 / 1M (56% Cheaper)',
    period: 'Credits Never Expire · 30-Day VIP 30 QPS SLA',
    estimate: '≈ 40.0M Tokens (GLM, DeepSeek, Qwen, Kimi, MiniMax)',
    popular: true,
    popularLabel: 'RECOMMENDED FOR CLAUDE CODE & CURSOR',
    features: [
      'Universal Pay-As-You-Go ($43.50 Balance)',
      'Automatic VIP Group Upgrade',
      '30 QPS Standard High Concurrency',
      'All Models Universal (GLM, DeepSeek, Qwen, Kimi, MiniMax)',
    ],
  },
  {
    price: '$99.00',
    amountNum: 99,
    credits: '$148.50 Credits',
    bonus: '⚡ 69% OFF · TEAM PRO',
    badgeColor: 'bg-emerald-600',
    unitCost: '$0.51 / 1M (69% Off Base)',
    period: 'Credits Never Expire · 30-Day VIP 30 QPS Cluster',
    estimate: '≈ 200M Tokens (Full Autonomous Coding & RAG)',
    popular: false,
    features: [
      'Universal Pay-As-You-Go ($148.50 Balance)',
      'High Concurrency 30 QPS Cluster',
      'Multi-channel Failover Auto-routing',
      'Team Multi-key Sub-token Distribution',
    ],
  },
  {
    price: '$299.00',
    amountNum: 299,
    credits: '$299.00 Credits',
    bonus: '🚀 79% OFF · WHOLESALE',
    badgeColor: 'bg-purple-600',
    unitCost: '$0.35 / 1M (Wholesale Batch)',
    period: 'Credits Never Expire · 30-Day VIP 60 QPS Pipeline',
    estimate: '≈ 850M Tokens (Heavy Batch Agent & Enterprise Scaling)',
    popular: false,
    features: [
      'Universal Pay-As-You-Go ($299.00 Balance)',
      'Wholesale Rate: $0.35/1M (Save 79% vs Starter)',
      '60 QPS Dedicated Throughput Pipeline',
      'Sub-second TTFT Response Guarantee',
      'Automated Enterprise Invoices & Receipts',
    ],
  },
  {
    price: '$899.00',
    amountNum: 899,
    credits: '$899.00 Credits',
    bonus: '👑 100 QPS · VIP FLAGSHIP',
    badgeColor: 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600',
    unitCost: '$0.35 / 1M (🔥 Guaranteed Lowest)',
    period: 'Credits Never Expire · 365-Day 100 QPS Flagship SLA',
    estimate: '≈ 2.5 Billion Tokens (Unlimited Team Year-round SLA)',
    popular: false,
    features: [
      'Universal Pay-As-You-Go ($899.00 Balance)',
      'Lowest Wholesale Rate: $0.35/1M (Save 79%)',
      '100 QPS Dedicated Ultra-High Concurrency',
      'Permanent Pool · Credits Never Expire',
      '1-on-1 VIP SLA & Enterprise Tax Invoices',
    ],
  },
]

interface PaygCreditGridProps {
  onSelectTier?: (tier: CheckoutTier) => void
}

export function PaygCreditGrid({ onSelectTier }: PaygCreditGridProps) {
  const { auth } = useAuthStore()
  const navigate = useNavigate()

  const handleTierClick = (tier: CheckoutTier) => {
    if (auth.user) {
      if (onSelectTier) {
        onSelectTier(tier)
      } else {
        navigate({
          to: '/wallet',
          search: { amount: tier.amountNum, auto_pay: true },
        })
      }
    } else {
      // Guest: redirect to sign-in with callback to /pricing with checkout params
      navigate({
        to: '/sign-in',
        search: {
          redirect: `/pricing?checkout_amount=${tier.amountNum}&checkout=true`,
        },
      })
    }
  }

  return (
    <div className='space-y-8 max-w-[1800px] mx-auto mt-6'>
      {/* Top Banner Notice */}
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs backdrop-blur-md shadow-sm'>
        <div className='flex items-center gap-2.5 font-bold text-foreground'>
          <Zap className='size-4 text-blue-500 shrink-0' />
          <span>Top-Tier Chinese LLMs Gateway (DeepSeek-V4, Qwen 3.8, Kimi K3, GLM 5.3) — Zero Chinese ID Required & Instant Global PayPal Activation.</span>
        </div>
        <span className='rounded-full bg-blue-500 px-3 py-0.5 font-bold text-white text-[11px] shadow-xs'>
          Instant 0-Delay Activation
        </span>
      </div>

      {/* 5-Tier Conversion Grid */}
      <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        {PAYG_TIERS.map((t) => (
          <div
            key={t.price}
            className={cn(
              'relative flex flex-col justify-between rounded-2xl border p-5 backdrop-blur-sm transition-all duration-300 overflow-hidden hover:scale-[1.015]',
              t.popular
                ? 'border-blue-500 bg-gradient-to-b from-blue-500/10 via-background to-blue-500/5 shadow-[0_4px_30px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/40'
                : t.amountNum === 899
                ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-background to-indigo-500/5 shadow-[0_4px_25px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/30'
                : 'border-border/40 bg-muted/15 hover:border-border/60'
            )}
          >
            {/* Top Right Bonus Percentage Badge */}
            <span className={cn('absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs', t.badgeColor)}>
              {t.bonus}
            </span>

            {t.popular && (
              <span className='absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs'>
                <Sparkles className='size-2.5' />
                {t.popularLabel}
              </span>
            )}

            {t.amountNum === 899 && (
              <span className='absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs'>
                <Crown className='size-2.5 text-amber-200' />
                ENTERPRISE FLAGSHIP
              </span>
            )}

            <div className='space-y-3.5 pt-5'>
              <div>
                <div className='text-3xl font-extrabold tracking-tight text-foreground'>{t.price}</div>
                <div className='mt-1 font-mono text-base font-bold text-blue-600 dark:text-blue-400'>
                  {t.credits}
                </div>
                
                {/* Unit Cost Metric & Period */}
                <div className='mt-2 flex flex-col gap-1'>
                  <div className='inline-flex items-center w-fit gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400'>
                    <span>🏷️</span>
                    <span>{t.unitCost}</span>
                  </div>
                  <div className='flex items-center gap-1 text-[11px] text-muted-foreground font-medium'>
                    <Clock className='size-3 shrink-0 text-muted-foreground/70' />
                    <span>{t.period}</span>
                  </div>
                </div>
              </div>

              {/* Value Perception Box */}
              <div className='rounded-xl bg-muted/40 border border-border/30 p-2.5 text-[11px] font-medium text-muted-foreground leading-snug'>
                <span className='font-bold text-foreground block mb-0.5'>💡 Estimated Capacity:</span>
                {t.estimate}
              </div>

              {/* Feature Checklist */}
              {t.features && (
                <ul className='space-y-1.5 text-xs text-muted-foreground pt-1'>
                  {t.features.map((feat, idx) => (
                    <li key={idx} className='flex items-start gap-1.5 leading-snug'>
                      <Check className='size-3.5 text-emerald-500 shrink-0 mt-0.5' />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className='mt-5 pt-3.5 border-t border-border/20 space-y-2'>
              <button
                type='button'
                onClick={() => handleTierClick(t)}
                className={cn(
                  'inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm',
                  t.popular
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
                    : t.amountNum === 899
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white hover:from-amber-600 hover:to-indigo-700 shadow-amber-500/20'
                    : 'bg-muted/80 text-foreground hover:bg-muted border border-border/40'
                )}
              >
                <span>Get Started ({t.price})</span>
                <ArrowRight className='size-3.5' />
              </button>

              <div className='flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-medium pt-0.5'>
                <span className='inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 font-bold text-blue-600 dark:text-blue-400'>
                  <SiPaypal className='size-2.5 text-[#003087] dark:text-[#0079C1] shrink-0' />
                  <span>PayPal 推荐</span>
                </span>
                <span className='inline-flex items-center gap-1 text-muted-foreground/80'>
                  <CreditCard className='size-2.5 shrink-0 text-muted-foreground' />
                  <span>Credit Card</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

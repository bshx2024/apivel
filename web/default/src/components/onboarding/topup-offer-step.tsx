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
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Zap,
  Flame,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Key,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { track } from '@/lib/tracker'

interface TopupOfferStepProps {
  onSelectAmount: (amount: number) => void
  onViewCredentials: () => void
  onClose: () => void
}

export function TopupOfferStep({
  onSelectAmount,
  onViewCredentials,
  onClose,
}: TopupOfferStepProps) {
  const { t } = useTranslation()

  // 15 minutes flash timer
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 15 * 60))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const TIERS = [
    {
      amount: 5,
      displayPrice: '$4.99',
      receivedAmount: '$7.50',
      badge: t('⚡ Starter · Recommended'),
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      isPopular: true,
      title: t('Quick Test Pack'),
      tokens: t('≈ 3.5M Base Tokens'),
      highlight: t('Up to 20M+ tokens on DeepSeek-v4-flash'),
      features: [
        t('First deposit bonus +50% included'),
        t('Universal for all frontier models'),
        t('Balance never expires'),
      ],
      ctaText: t('Activate for $4.99'),
      icon: Zap,
      borderClass: 'border-amber-500/50 dark:border-amber-500/40 shadow-md ring-1 ring-amber-500/30',
      bgGradient: 'from-amber-500/5 via-background to-background',
    },
    {
      amount: 29,
      displayPrice: '$29',
      receivedAmount: '$43.50',
      badge: t('🔥 56% OFF · POPULAR'),
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      isPopular: false,
      title: t('Developer Pro Pack'),
      tokens: t('≈ 40M Base Tokens'),
      highlight: t('Ideal for indie hackers & small production apps'),
      features: [
        t('First deposit bonus +50% included'),
        t('Dedicated low-latency edge routing'),
        t('Multi-model concurrent testing'),
      ],
      ctaText: t('Get $29 Package'),
      icon: Flame,
      borderClass: 'border-border/80 hover:border-border',
      bgGradient: 'from-muted/20 via-background to-background',
    },
    {
      amount: 99,
      displayPrice: '$99',
      receivedAmount: '$148.50',
      badge: t('🚀 69% OFF · Scale'),
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      isPopular: false,
      title: t('Team Production Pack'),
      tokens: t('≈ 200M Base Tokens'),
      highlight: t('30 QPS dedicated dispatch pool'),
      features: [
        t('First deposit bonus +50% included'),
        t('High-throughput enterprise SLA'),
        t('Priority ticket & tech support'),
      ],
      ctaText: t('Get $99 Package'),
      icon: Rocket,
      borderClass: 'border-border/80 hover:border-border',
      bgGradient: 'from-muted/20 via-background to-background',
    },
  ]

  const handleChoose = (amount: number) => {
    track('onboarding_topup_selected', { amount })
    try {
      localStorage.setItem('apivel_has_seen_quickstart', 'true')
    } catch {
      /* ignore */
    }
    onSelectAmount(amount)
  }

  return (
    <div className='flex flex-col h-full max-h-[82vh] overflow-y-auto px-6 py-5 space-y-5'>
      {/* Step Header */}
      <div className='flex items-center justify-between pb-2 border-b border-border/50'>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold px-2.5 py-0.5 text-xs'>
            <Sparkles className='h-3 w-3 mr-1 inline' />
            {t('Step 2 of 2 · Privileges Ready')}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            {t('Exclusive new user welcome privilege')}
          </span>
        </div>
        <button
          onClick={onClose}
          className='text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
        >
          {t('Close')}
        </button>
      </div>

      {/* Main Title & Flash Banner */}
      <div className='space-y-3'>
        <div>
          <h3 className='text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2'>
            🎉 {t('Workspace Initialized! Claim First Deposit Bonus')}
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5 leading-relaxed'>
            {t('Get +50% extra compute credits automatically on your first top-up. Zero risk, credits never expire.')}
          </p>
        </div>

        {/* Countdown Flash Ribbon */}
        <div className='flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-red-500/15 via-amber-500/10 to-orange-500/15 border border-red-500/30 p-2.5 text-xs shadow-xs'>
          <div className='flex items-center gap-2 font-bold text-red-600 dark:text-red-400 text-xs sm:text-xs'>
            <span className='animate-pulse text-base'>🎁</span>
            <span>{t('First Deposit Privilege: All packages automatically get +50% extra credits')}</span>
          </div>
          <div className='flex items-center gap-1 font-mono text-xs font-bold bg-background/80 px-2 py-0.5 rounded border border-red-500/20 shrink-0'>
            <span className='text-[10px] text-muted-foreground font-sans'>{t('Ends in')}:</span>
            <span className='text-red-500'>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* 3 Tier Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1'>
        {TIERS.map((tier) => {
          const Icon = tier.icon
          return (
            <div
              key={tier.amount}
              className={`relative rounded-2xl border bg-gradient-to-b ${tier.bgGradient} ${tier.borderClass} p-4 flex flex-col justify-between transition-all hover:shadow-lg`}
            >
              {tier.isPopular && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                  <span className='bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs'>
                    {t('Most Popular')}
                  </span>
                </div>
              )}

              <div className='space-y-3'>
                {/* Header */}
                <div className='flex items-start justify-between gap-1'>
                  <div>
                    <span className={`inline-block text-[10px] font-bold border px-2 py-0.5 rounded-full ${tier.badgeClass}`}>
                      {tier.badge}
                    </span>
                    <h4 className='text-sm font-bold text-foreground mt-1.5 flex items-center gap-1.5'>
                      <Icon className='h-4 w-4 text-primary shrink-0' />
                      {tier.title}
                    </h4>
                  </div>
                </div>

                {/* Pricing & Bonus */}
                <div className='pt-1'>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-2xl sm:text-3xl font-extrabold text-foreground'>
                      {tier.displayPrice}
                    </span>
                    <span className='text-xs text-muted-foreground line-through'>
                      {tier.receivedAmount}
                    </span>
                  </div>
                  <div className='mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md'>
                    <Sparkles className='h-3 w-3' />
                    <span>{t('Receive')} {tier.receivedAmount} (+50%)</span>
                  </div>
                </div>

                {/* Token Capacity */}
                <div className='p-2 rounded-lg bg-muted/40 border border-border/40 text-[11px] space-y-0.5'>
                  <div className='font-semibold text-foreground'>{tier.tokens}</div>
                  <div className='text-[10px] text-muted-foreground leading-tight'>{tier.highlight}</div>
                </div>

                {/* Features List */}
                <ul className='space-y-1.5 pt-1 text-[11px] text-muted-foreground'>
                  {tier.features.map((feat, i) => (
                    <li key={i} className='flex items-center gap-1.5'>
                      <CheckCircle2 className='h-3 w-3 text-emerald-500 shrink-0' />
                      <span className='truncate'>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className='pt-4 mt-2'>
                <Button
                  onClick={() => handleChoose(tier.amount)}
                  className={`w-full font-bold text-xs h-9 shadow-xs cursor-pointer ${
                    tier.isPopular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className='h-3.5 w-3.5 ml-1' />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust Badges */}
      <div className='rounded-xl bg-muted/30 border border-border/40 p-2.5 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-3 flex-wrap'>
          <span className='inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
            <ShieldCheck className='h-3.5 w-3.5' />
            PayPal & Stripe Verified
          </span>
          <span>•</span>
          <span className='inline-flex items-center gap-1'>
            <Lock className='h-3 w-3' />
            256-Bit Bank Encryption
          </span>
          <span>•</span>
          <span>Visa / Mastercard / Amex</span>
        </div>
        <span className='font-semibold text-foreground text-[10px]'>
          ⚡ {t('Instant 0-Delay Activation')}
        </span>
      </div>

      {/* Secondary Action: View Credentials */}
      <div className='pt-1 pb-1 flex items-center justify-between text-xs'>
        <Button
          variant='ghost'
          size='sm'
          onClick={onViewCredentials}
          className='text-xs text-muted-foreground hover:text-foreground font-medium gap-1.5 cursor-pointer p-0 h-auto'
        >
          <Key className='h-3.5 w-3.5' />
          <span>{t('Skip deposit, view API key & integration code')} →</span>
        </Button>
        <span className='text-[11px] text-muted-foreground'>
          {t('Credits never expire')}
        </span>
      </div>
    </div>
  )
}

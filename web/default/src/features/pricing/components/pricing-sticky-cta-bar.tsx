import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Gift,
  CreditCard,
  Zap,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import type { CheckoutTier } from './one-click-checkout-modal'

interface PricingStickyCtaBarProps {
  onOpenCheckout: (tier: CheckoutTier) => void
  onOpenConnect: () => void
}

export function PricingStickyCtaBar({
  onOpenCheckout,
  onOpenConnect,
}: PricingStickyCtaBarProps) {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      if (window.scrollY > 300 && !dismissed) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [dismissed])

  if (!mounted || !visible || dismissed || typeof document === 'undefined') return null

  const quickTestTier: CheckoutTier = {
    price: '$5',
    amountNum: 5,
    credits: '$7.50 Credits',
    bonus: '⚡ Quick Test',
    popular: false,
    unitCost: '$1.66 / 1M',
    period: 'Credits Never Expire · 5 QPS Test Queue',
    estimate: '≈ 3.0M Tokens (DeepSeek-V4-Flash / GLM-5.3-Flash)',
  }

  const content = (
    <aside
      aria-label={t('sticky_cta_bar_aria_label', 'Special Offer')}
      className='fixed bottom-5 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none'
    >
      <div className='max-w-4xl mx-auto pointer-events-auto rounded-2xl border border-blue-500/35 dark:border-blue-500/50 bg-background/95 backdrop-blur-2xl p-3 sm:p-3.5 shadow-[0_12px_45px_rgba(0,0,0,0.35)] dark:shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-6 duration-300 ring-1 ring-blue-500/20'>
        {/* Left Trust Statement */}
        <div className='flex items-center gap-3 w-full sm:w-auto'>
          <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 shadow-sm'>
            <Zap className='size-4 animate-pulse text-blue-500' />
          </span>
          <div className='text-left'>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-bold text-foreground'>
                {t('APIVEL Global Gateway')}
              </span>
              <span className='inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full'>
                <Sparkles className='size-2.5' /> {t('Credits Never Expire')}
              </span>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block'>
              {t('Low-latency overseas proxy for DeepSeek, Qwen 3.7 & GLM-5.3. 1-click connect to Cursor.')}
            </p>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
          {/* Quick Connect trigger */}
          <Button
            size='sm'
            variant='outline'
            onClick={onOpenConnect}
            className='h-8 text-xs font-semibold border-border/60 hover:bg-muted/80 gap-1 cursor-pointer'
          >
            <Zap className='size-3 text-blue-500' />
            <span className='hidden xs:inline'>{t('Quick Connect')}</span>
            <span className='xs:hidden'>{t('Connect')}</span>
          </Button>

          {/* $5 Quick Test Checkout */}
          <Button
            size='sm'
            onClick={() => onOpenCheckout(quickTestTier)}
            className='h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1 shadow-sm cursor-pointer'
          >
            <CreditCard className='size-3' />
            <span>{t('$5 Quick Test', '$5 极速测试')}</span>
          </Button>

          {/* Free Credit Link for Guests */}
          {!auth.user ? (
            <Link
              to='/sign-up'
              search={{ redirect: '/pricing' }}
              className='inline-flex h-8 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 px-3 text-xs font-bold text-white shadow-sm shadow-blue-500/25 transition-all gap-1 cursor-pointer'
            >
              <Gift className='size-3 text-amber-300' />
              <span>{t('Claim $0.20 Free')}</span>
              <ArrowRight className='size-3' />
            </Link>
          ) : (
            <Link
              to='/wallet'
              className='inline-flex h-8 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 px-3 text-xs font-bold text-white shadow-sm shadow-blue-500/25 transition-all gap-1 cursor-pointer'
            >
              <span>{t('Wallet')}</span>
              <ArrowRight className='size-3' />
            </Link>
          )}

          {/* Dismiss button */}
          <button
            type='button'
            onClick={() => setDismissed(true)}
            className='p-1 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 cursor-pointer ml-0.5'
            aria-label='Close bar'
          >
            <X className='size-3.5' />
          </button>
        </div>
      </div>
    </aside>
  )

  return createPortal(content, document.body)
}

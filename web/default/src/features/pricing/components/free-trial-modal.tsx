import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Gift, Sparkles, Check, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

const STORAGE_KEY = 'apivel_free_trial_modal_dismissed'

export function FreeTrialModal() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // If user is logged in or already dismissed, do not open
    if (auth.user) return

    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true'
    if (isDismissed) return

    // Show popup after 2 seconds on Pricing page
    const timer = setTimeout(() => {
      setOpen(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [auth.user])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  const handleDismissForever = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  if (auth.user) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md p-0 overflow-hidden border border-blue-500/25 dark:border-blue-500/40 shadow-2xl backdrop-blur-xl bg-background/95 rounded-2xl'>
        {/* Header Banner */}
        <div className='relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white overflow-hidden'>
          <div className='absolute -right-6 -top-6 size-32 rounded-full bg-white/10 blur-2xl pointer-events-none' />
          <div className='relative z-10 flex items-center gap-3'>
            <span className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/20 text-white backdrop-blur-md shadow-lg'>
              <Gift className='size-6 animate-pulse' />
            </span>
            <div>
              <span className='inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-blue-100 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm'>
                <Sparkles className='size-3 text-yellow-300' /> Limited Time Developer Trial
              </span>
              <h3 className='text-xl font-bold mt-1 text-white leading-snug'>
                {t('pricing_modal_title', 'Claim $0.20 Free Trial Quota')}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className='p-6 space-y-5'>
          <DialogHeader className='p-0 text-left space-y-1.5'>
            <DialogTitle className='sr-only'>Claim Free Trial Quota</DialogTitle>
            <DialogDescription className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
              {t(
                'pricing_modal_desc',
                'Sign up in 10 seconds to receive 100,000 free API credits ($0.20) instantly. Test DeepSeek V4 Pro, Qwen 3.8 Max, and GLM-5.3 zero-cost.'
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Highlights */}
          <div className='rounded-xl bg-muted/40 border border-border/40 p-3.5 space-y-2 text-xs'>
            <div className='flex items-center gap-2 font-medium text-foreground'>
              <Check className='size-4 text-emerald-500 shrink-0' />
              <span><strong>100,000 Free Credits</strong> ($0.20 instant trial)</span>
            </div>
            <div className='flex items-center gap-2 font-medium text-foreground'>
              <Check className='size-4 text-emerald-500 shrink-0' />
              <span><strong>No Credit Card Required</strong> — Instant OAuth signup</span>
            </div>
            <div className='flex items-center gap-2 font-medium text-foreground'>
              <Check className='size-4 text-emerald-500 shrink-0' />
              <span><strong>Full Model Access</strong> — DeepSeek V4 Pro & GLM-5.3</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className='space-y-2 pt-1'>
            <Link
              to='/sign-up?redirect=/pricing'
              onClick={() => handleOpenChange(false)}
              className='w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer'
            >
              <span>{t('pricing_modal_cta', 'Claim $0.20 Free Credits Now')}</span>
              <ArrowRight className='size-4' />
            </Link>

            <div className='flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1'>
              <span>Already have an account? <Link to='/sign-in?redirect=/pricing' className='text-blue-500 font-semibold hover:underline'>Sign in</Link></span>
              <button
                type='button'
                onClick={handleDismissForever}
                className='text-muted-foreground/70 hover:text-muted-foreground underline cursor-pointer'
              >
                Don't show again
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

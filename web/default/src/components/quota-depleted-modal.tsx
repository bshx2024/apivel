/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface QuotaDepletedModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function QuotaDepletedModal({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: QuotaDepletedModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = setControlledOpen || setInternalOpen

  // Listen for global custom event 'quota-depleted'
  useEffect(() => {
    const handleQuotaDepleted = () => {
      setIsOpen(true)
    }

    window.addEventListener('apivale-quota-depleted', handleQuotaDepleted)
    return () => {
      window.removeEventListener('apivale-quota-depleted', handleQuotaDepleted)
    }
  }, [setIsOpen])

  const handleTakeALook = () => {
    setIsOpen(false)
    navigate({ to: '/wallet', search: { amount: 5 } })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='max-w-md rounded-2xl p-6 backdrop-blur-xl border border-blue-500/30 shadow-2xl'>
        <DialogHeader className='space-y-3 text-center sm:text-left'>
          <div className='mx-auto sm:mx-0 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 shadow-inner'>
            <Zap className='size-6' />
          </div>
          <DialogTitle className='text-xl font-bold tracking-tight text-foreground'>
            {t('quota_depleted_title', '🎉 Free Trial Quota Completed')}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground leading-relaxed'>
            {t(
              'quota_depleted_desc',
              'You have experienced your initial free trial credits. Get our $5 Quick Test Pack (3M Tokens) or $29 Developer Starter (40M Tokens) to keep coding without interruption.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits Box */}
        <div className='my-2 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3.5 space-y-2 text-xs'>
          <div className='flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold'>
            <span>{t('Special Developer Starter Offer')}</span>
            <span className='rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] text-white font-semibold'>
              4X VALUE
            </span>
          </div>
          <ul className='space-y-1.5 text-muted-foreground text-[11px] leading-snug'>
            <li className='flex items-center gap-1.5'>
              <ShieldCheck className='size-3.5 text-blue-500 shrink-0' />
              <span>{t('Instant PayPal & Card Checkout · Zero Chinese ID Required')}</span>
            </li>
            <li className='flex items-center gap-1.5'>
              <Sparkles className='size-3.5 text-blue-500 shrink-0' />
              <span>{t('$5 Quick Test ($7.50 Credits) or $29 Starter Pack ($43.50 Credits · Never Expire)')}</span>
            </li>
            <li className='flex items-center gap-1.5'>
              <Zap className='size-3.5 text-amber-500 shrink-0' />
              <span>{t('999+ Developers Verified · Standard 30 QPS Concurrency')}</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className='mt-3 flex flex-col gap-2'>
          <Button
            type='button'
            onClick={handleTakeALook}
            className='h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 cursor-pointer text-sm transition-all'
          >
            <span>{t('Top Up $5 Quick Test Pack →', '充值 $5 极速测试包 →')}</span>
          </Button>
          <button
            type='button'
            onClick={() => setIsOpen(false)}
            className='py-1 text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
          >
            {t('Later', 'Maybe Later')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Global Helper to trigger the quota depleted modal from anywhere */
export function triggerQuotaDepletedModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('apivale-quota-depleted'))
  }
}

/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { useState, useEffect } from 'react'
import { Check, X, Crown, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SvipComparisonModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SvipComparisonModal({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: SvipComparisonModalProps) {
  const navigate = useNavigate()
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = setControlledOpen || setInternalOpen

  // Listen for global custom event 'apivale-open-svip-modal'
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
    }

    window.addEventListener('apivale-open-svip-modal', handleOpen)
    return () => {
      window.removeEventListener('apivale-open-svip-modal', handleOpen)
    }
  }, [setIsOpen])

  const handleStartTrial = () => {
    setIsOpen(false)
    navigate({ to: '/wallet', search: { amount: 5, auto_pay: true } })
  }

  const features = [
    { name: 'Model Access (DeepSeek-V4, GPT-5.6, Kimi K3)', svip: 'Full Access', basic: 'Limited Models' },
    { name: '0-Latency Fast Queue Routing', svip: true, basic: false },
    { name: '128k Long Context Window', svip: true, basic: false },
    { name: 'High Concurrency Limit', svip: '30~100+ QPS', basic: '5 QPS' },
    { name: 'Credits Expiration', svip: 'Never Expire', basic: 'Never Expire' },
    { name: 'Dedicated Anti-Ban SLA Routing', svip: true, basic: false },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='max-w-2xl rounded-3xl p-6 md:p-8 backdrop-blur-2xl border border-amber-500/30 bg-gradient-to-b from-background via-background/95 to-amber-500/5 shadow-2xl overflow-hidden'>
        {/* Top Header Banner */}
        <div className='text-center space-y-2'>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs'>
            <Crown className='size-3.5 fill-amber-500 text-amber-500' />
            <span>SPECIAL NEW USER OFFER</span>
          </div>
          <DialogTitle className='text-2xl md:text-3xl font-extrabold tracking-tight text-foreground'>
            You have a chance to try <span className='text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500'>APIVEL SVIP</span> for <span className='text-amber-500'>US$5.00</span>
          </DialogTitle>
          <DialogDescription className='text-xs md:text-sm text-muted-foreground max-w-lg mx-auto'>
            Unlock top-tier China & global AI model routing (DeepSeek-V4, GPT-5.6, Kimi K3) with zero-latency fast queue and 100+ QPS concurrency.
          </DialogDescription>
        </div>

        {/* Feature Comparison Matrix Table (SeaArt Style) */}
        <div className='my-4 grid grid-cols-12 gap-3 items-stretch text-xs'>
          {/* Key Features Column */}
          <div className='col-span-5 flex flex-col justify-around py-2 pr-2 font-medium text-muted-foreground space-y-2'>
            <div className='font-bold text-foreground text-xs uppercase tracking-wider h-7 flex items-center'>
              Key Features
            </div>
            {features.map((feat) => (
              <div key={feat.name} className='h-8 flex items-center text-[11px] leading-tight font-medium'>
                {feat.name}
              </div>
            ))}
          </div>

          {/* SVIP Column (Highlighted Gold) */}
          <div className='col-span-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-amber-500/10 to-amber-500/20 border border-amber-500/40 p-3 flex flex-col justify-around text-center shadow-lg shadow-amber-500/10 relative'>
            <span className='absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-extrabold text-black uppercase tracking-wider shadow-sm'>
              Recommended
            </span>
            <div className='font-extrabold text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center gap-1 h-7'>
              <Crown className='size-3.5 fill-current' />
              <span>APIVEL SVIP</span>
            </div>
            {features.map((feat) => (
              <div key={feat.name} className='h-8 flex items-center justify-center font-bold text-foreground'>
                {typeof feat.svip === 'boolean' ? (
                  feat.svip ? (
                    <Check className='size-4 text-amber-500 stroke-[3]' />
                  ) : (
                    <X className='size-4 text-muted-foreground/40' />
                  )
                ) : (
                  <span className='text-amber-600 dark:text-amber-400 font-extrabold text-[11px]'>{feat.svip}</span>
                )}
              </div>
            ))}
          </div>

          {/* Basic Column */}
          <div className='col-span-3 rounded-2xl bg-muted/30 border border-border/40 p-3 flex flex-col justify-around text-center opacity-70'>
            <div className='font-bold text-muted-foreground text-xs h-7 flex items-center justify-center'>
              Basic Free
            </div>
            {features.map((feat) => (
              <div key={feat.name} className='h-8 flex items-center justify-center text-muted-foreground'>
                {typeof feat.basic === 'boolean' ? (
                  feat.basic ? (
                    <Check className='size-4 text-emerald-500' />
                  ) : (
                    <X className='size-4 text-muted-foreground/40' />
                  )
                ) : (
                  <span className='text-[10px] text-muted-foreground/70'>{feat.basic}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Developer Social Proof Testimonial Card */}
        <div className='my-1 rounded-2xl bg-muted/40 border border-border/30 p-3 flex items-center gap-3 text-xs'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs shadow-md'>
            AK
          </div>
          <div className='space-y-0.5 min-w-0'>
            <div className='flex items-center justify-between gap-2'>
              <span className='font-bold text-foreground text-xs truncate'>Alex K. — Senior Full-Stack Engineer</span>
              <span className='text-[10px] text-emerald-500 font-semibold shrink-0'>Verified SVIP Buyer</span>
            </div>
            <p className='text-[11px] text-muted-foreground leading-tight italic truncate'>
              &quot;Switching to APIVEL saved our startup 60%+ in API costs with blazingly fast DeepSeek-V4 response times.&quot;
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className='mt-4 flex flex-col gap-2'>
          <Button
            type='button'
            onClick={handleStartTrial}
            className='h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-extrabold text-black hover:from-amber-400 hover:to-orange-400 shadow-xl shadow-amber-500/20 text-sm transition-all cursor-pointer'
          >
            <span>Start Quick Test Trial (US$5.00)</span>
            <ArrowRight className='size-4' />
          </Button>
          <div className='flex items-center justify-center gap-3 text-[11px] text-muted-foreground/80 font-medium'>
            <span>💳 Instant PayPal & Card Checkout</span>
            <span>•</span>
            <span>🔒 256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>⚡ Credits Never Expire</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Global Trigger function */
export function triggerSvipComparisonModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('apivale-open-svip-modal'))
  }
}

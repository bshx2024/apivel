/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { useState, useEffect } from 'react'
import { Crown, Sparkles, Zap, ShieldCheck, ArrowRight, ChevronDown } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { triggerSvipComparisonModal } from '@/components/svip-comparison-modal'

export function HeaderDiscountPill() {
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59) // 14:59 timer

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 14 * 60 + 59))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const handleGo = () => {
    triggerSvipComparisonModal()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-red-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:border-amber-500/60 transition-all cursor-pointer shadow-xs backdrop-blur-md group'
        >
          <span className='animate-pulse text-xs'>🔥</span>
          <span className='rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-extrabold text-black uppercase tracking-wider'>
            VIP 34% OFF
          </span>
          <span className='font-mono font-extrabold text-red-500 dark:text-red-400 text-[11px]'>
            {formattedTime}
          </span>
          <ChevronDown className='size-3 text-amber-500 group-hover:translate-y-0.5 transition-transform' />
        </button>
      </PopoverTrigger>

      {/* SeaArt Crown Card Popover Content */}
      <PopoverContent
        align='end'
        className='w-80 rounded-3xl p-5 border border-amber-500/30 bg-background/95 backdrop-blur-2xl shadow-2xl space-y-4'
      >
        {/* Top Crown Banner */}
        <div className='flex items-center gap-3'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/30 border border-amber-500/30 text-amber-500 shadow-inner'>
            <Crown className='size-6 fill-amber-500 text-amber-500' />
          </div>
          <div>
            <div className='flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider'>
              <span>APIVEL SVIP Trial</span>
            </div>
            <h4 className='text-sm font-extrabold text-foreground'>
              US$5.00 Quick-Trial Pass
            </h4>
          </div>
        </div>

        {/* 4 Privileges Grid (SeaArt Style) */}
        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div className='rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 space-y-1'>
            <div className='flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px]'>
              <Zap className='size-3.5 shrink-0 text-amber-500' />
              <span>Fast Queue</span>
            </div>
            <p className='text-[10px] text-muted-foreground leading-tight'>
              Zero-latency priority routing
            </p>
          </div>

          <div className='rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 space-y-1'>
            <div className='flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px]'>
              <Sparkles className='size-3.5 shrink-0 text-amber-500' />
              <span>Full Speed</span>
            </div>
            <p className='text-[10px] text-muted-foreground leading-tight'>
              DeepSeek-V4 & GPT-5.6
            </p>
          </div>

          <div className='rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 space-y-1'>
            <div className='flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px]'>
              <ShieldCheck className='size-3.5 shrink-0 text-amber-500' />
              <span>128k Context</span>
            </div>
            <p className='text-[10px] text-muted-foreground leading-tight'>
              Full long-window support
            </p>
          </div>

          <div className='rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 space-y-1'>
            <div className='flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px]'>
              <Crown className='size-3.5 shrink-0 text-amber-500' />
              <span>99.9% SLA</span>
            </div>
            <p className='text-[10px] text-muted-foreground leading-tight'>
              Dedicated uptime guarantee
            </p>
          </div>
        </div>

        {/* Action Button & Timer */}
        <div className='pt-1 space-y-2'>
          <div className='flex items-center justify-between text-[11px] text-muted-foreground font-medium'>
            <span>Limited Offer (24 Hours)</span>
            <span className='font-mono font-bold text-red-500'>[ {formattedTime} ]</span>
          </div>
          <button
            type='button'
            onClick={handleGo}
            className='flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-extrabold text-black hover:from-amber-400 hover:to-orange-400 shadow-md shadow-amber-500/20 text-xs transition-all cursor-pointer'
          >
            <span>GO & Unlock SVIP</span>
            <ArrowRight className='size-3.5' />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

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
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Terminal, Sparkles, Calculator as CalcIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { HeroTerminalDemo } from '../hero-terminal-demo'
import { LivePlayground } from './live-playground'
import { Calculator } from './calculator'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'playground' | 'calculator' | 'terminal'>('playground')

  return (
    <section className='relative z-10 flex flex-col items-center overflow-hidden px-4 pt-20 pb-10 md:pt-24 md:pb-14'>
      {/* Radial gradient background */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-25 dark:opacity-[0.12]'
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.15 200 / 60%) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 35% at 40% 80%, oklch(0.70 0.12 280 / 40%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />
      {/* Grid pattern */}
      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.08]'
      />

      <div className='flex max-w-3xl flex-col items-center text-center'>
        <div 
          className='landing-animate-fade-up mb-4 flex flex-col items-center gap-2 opacity-0'
          style={{ animationDelay: '0ms' }}
        >
          <Link
            to='/sign-up'
            className='group inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md hover:bg-blue-500/20 hover:border-blue-500/50 transition-all shadow-sm'
          >
            <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
            <span>{t('⚡ Zero Card Required: Sign up in 5s & get $0.20 free credit — test GPT API price & models without surprise bills →')}</span>
          </Link>
        </div>

        <h1
          className='landing-animate-fade-up text-[clamp(1.85rem,5vw,3.25rem)] leading-[1.15] font-bold tracking-tight'
          style={{ animationDelay: '40ms' }}
        >
          {t('The Smarter GPT API Price')}
          <br />
          <span className='bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent'>
            {t('& Performance Alternative')}
          </span>
        </h1>
        <p
          className='landing-animate-fade-up text-muted-foreground/80 mt-3 max-w-2xl text-xs leading-relaxed opacity-0 sm:text-sm md:text-base'
          style={{ animationDelay: '100ms' }}
        >
          {t('100% OpenAI-compatible GPT API pricing from $0.10 / 1M tokens. Compare token costs, run live price calculations, and save up to 90% without surprise bills.')}
        </p>
        <p
          className='landing-animate-fade-up text-muted-foreground/60 mt-1.5 max-w-xl text-[11px] leading-relaxed opacity-0 hidden sm:block'
          style={{ animationDelay: '130ms' }}
        >
          {t('Connect DeepSeek, Qwen & GLM instantly to Cursor, Claude Code CLI, NextChat, and official OpenAI SDKs with transparent pay-as-you-go pricing.')}
        </p>

        <div
          className='landing-animate-fade-up mt-6 flex flex-col items-center justify-center gap-2.5 opacity-0'
          style={{ animationDelay: '160ms' }}
        >
          <div className='flex flex-wrap items-center justify-center gap-3'>
            {props.isAuthenticated ? (
              <Button
                className='group rounded-lg bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-500/20'
                render={<Link to='/dashboard' />}
              >
                {t('Go to Dashboard')}
                <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
              </Button>
            ) : (
              <>
                <Button
                  className='group rounded-lg bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-500/20'
                  render={<Link to='/sign-up' />}
                >
                  {t('Start Free Trial ($0.20 Credit)')}
                  <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>

                <Button
                  variant='outline'
                  className='border-border/50 hover:border-border hover:bg-muted/50 rounded-lg'
                  render={<Link to='/pricing' />}
                >
                  {t('GPT API Price List')}
                </Button>
              </>
            )}
          </div>
          {!props.isAuthenticated && (
            <div className='text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5'>
              <span className='text-emerald-500 font-bold'>✓</span>
              <span>{t('🎁 Instant $0.20 credited automatically on signup · Zero card required · PayPal accepted')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Core Demo & Interactive Playground Showcase */}
      <div
        className='landing-animate-fade-up mt-8 w-full max-w-4xl opacity-0 space-y-4'
        style={{ animationDelay: '260ms' }}
      >
        {/* Toggle Bar */}
        <div className='flex items-center justify-center gap-2'>
          <div className='inline-flex items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-1 backdrop-blur-sm'>
            <button
              type='button'
              onClick={() => setActiveTab('playground')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === 'playground'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Sparkles className='size-3.5 text-amber-300' />
              {t('⚡ Live Playground (Free Trial)')}
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === 'calculator'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <CalcIcon className='size-3.5 text-emerald-400' />
              {t('📊 GPT API Price Calculator')}
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === 'terminal'
                  ? 'bg-foreground text-background shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Terminal className='size-3.5' />
              {t('💻 SDK Terminal Demo')}
            </button>
          </div>
        </div>

        {/* Tab Panel Render */}
        <div className='w-full'>
          {activeTab === 'playground' && <LivePlayground />}
          {activeTab === 'calculator' && <Calculator />}
          {activeTab === 'terminal' && <HeroTerminalDemo />}
        </div>
      </div>
    </section>
  )
}



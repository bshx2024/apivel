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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  // Selected models from screenshot
  const featuredModels = [
    { name: 'GLM-5.2', slug: 'infer/glm-5.2', tag: '⚡ Ultra Fast', latency: '95ms', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30' },
    { name: 'DeepSeek V4.1 Flash', slug: 'deepseek-v4.1-flash', tag: '🔥 Popular', latency: '120ms', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30' },
    { name: 'SenseNova 6.7 Flash Lite', slug: 'sensenova/sensenova-6.7-flash-lite', tag: '🚀 Fast Lite', latency: '80ms', color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30' },
    { name: 'Kimi K3', slug: 'kimi-k3', tag: '🧠 Reasoning', latency: '140ms', color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30' },
    { name: 'DeepSeek V4 Pro', slug: 'infer/deepseek-v4-pro', tag: '💎 Enterprise', latency: '160ms', color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30' },
    { name: 'LongCat 2.0', slug: 'Longcat/LongCat-2.0', tag: '🌟 128k Context', latency: '110ms', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30' },
    { name: 'Qwen 3.7 Max', slug: 'infer/qwen3.7-max', tag: '🎯 Coding Spec', latency: '130ms', color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30' },
    { name: 'MiniMax M3', slug: 'infer/minimax-m3', tag: '⚡ Multi-Modal', latency: '105ms', color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30' },
  ]

  return (
    <div className='relative grid h-svh max-w-none lg:grid-cols-2'>
      {/* Left side value proposition banner */}
      <div className='hidden lg:flex flex-col justify-between p-10 bg-neutral-950 border-r border-neutral-900 relative overflow-hidden select-none'>
        {/* Ambient glow backgrounds */}
        <div className='absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none' />
        <div className='absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none' />
        <div className='absolute top-1/2 right-10 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none' />

        {/* Brand Header */}
        <Link
          to='/'
          className='flex items-center gap-3 transition-opacity hover:opacity-80 relative z-10 w-fit'
        >
          <div className='relative h-9 w-9 rounded-full ring-2 ring-indigo-500/20 p-0.5 bg-neutral-900'>
            {loading ? (
              <Skeleton className='absolute inset-0 rounded-full' />
            ) : (
              <img
                src={(logo || '/logo.png') + '?v=2'}
                alt={t('Logo')}
                className='h-full w-full rounded-full object-cover'
              />
            )}
          </div>
          {loading ? (
            <Skeleton className='h-6 w-24' />
          ) : (
            <div className='flex flex-col'>
              <h1 className='text-xl font-extrabold text-white tracking-tight leading-none'>{systemName}</h1>
              <span className='text-[10px] font-semibold text-indigo-400 tracking-wider uppercase mt-0.5'>Global AI Developer Gateway</span>
            </div>
          )}
        </Link>

        {/* Center Content */}
        <div className='my-auto max-w-lg relative z-10 space-y-6 pt-4'>
          {/* Main Tag & Title */}
          <div className='space-y-3'>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 backdrop-blur-md shadow-sm'>
              <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
              ✦ Enterprise AI Proxy & Relay
            </span>
            <h2 className='text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent'>
              Supercharge Your AI Workflows
            </h2>
            <p className='text-neutral-400 text-sm leading-relaxed'>
              Access 40+ leading AI models globally with high-performance routing. Instantly top up via PayPal or credit card and route requests seamlessly with enterprise reliability.
            </p>
          </div>

          {/* Dynamic Animated Model Wall (模型墙动态演示) */}
          <div className='space-y-2 pt-2'>
            <div className='flex items-center justify-between text-xs font-semibold text-neutral-400 px-1'>
              <span className='flex items-center gap-1.5 text-neutral-300'>
                <span>🔥 Supported Cutting-Edge Models</span>
              </span>
              <span className='text-[11px] text-emerald-400 font-mono flex items-center gap-1'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping' />
                Live Status: 100% Operational
              </span>
            </div>

            {/* Continuous Marquee Ticker */}
            <div className='relative overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3 backdrop-blur-md'>
              {/* Fade gradients at edges */}
              <div className='absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-900 to-transparent z-10 pointer-events-none' />
              <div className='absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-900 to-transparent z-10 pointer-events-none' />

              <style>{`
                @keyframes marqueeRow1 {
                  0% { transform: translateX(0%); }
                  100% { transform: translateX(-50%); }
                }
                @keyframes marqueeRow2 {
                  0% { transform: translateX(-50%); }
                  100% { transform: translateX(0%); }
                }
                .animate-marquee-1 {
                  display: flex;
                  width: max-content;
                  animation: marqueeRow1 28s linear infinite;
                }
                .animate-marquee-1:hover, .animate-marquee-2:hover {
                  animation-play-state: paused;
                }
                .animate-marquee-2 {
                  display: flex;
                  width: max-content;
                  animation: marqueeRow2 32s linear infinite;
                }
              `}</style>

              {/* Row 1: Forward Marquee */}
              <div className='overflow-hidden mb-2.5'>
                <div className='animate-marquee-1 gap-2.5'>
                  {[...featuredModels, ...featuredModels].map((m, idx) => (
                    <div
                      key={`row1-${m.slug}-${idx}`}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-gradient-to-r text-xs transition-all duration-300 hover:scale-105 cursor-pointer shadow-sm',
                        m.color
                      )}
                    >
                      <span className='font-bold text-white whitespace-nowrap'>{m.name}</span>
                      <span className='text-[10px] text-neutral-400 font-mono whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded border border-white/5'>
                        {m.slug}
                      </span>
                      <span className='text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50 whitespace-nowrap'>
                        {m.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Reverse Marquee */}
              <div className='overflow-hidden'>
                <div className='animate-marquee-2 gap-2.5'>
                  {[...featuredModels.slice().reverse(), ...featuredModels.slice().reverse()].map((m, idx) => (
                    <div
                      key={`row2-${m.slug}-${idx}`}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-gradient-to-r text-xs transition-all duration-300 hover:scale-105 cursor-pointer shadow-sm',
                        m.color
                      )}
                    >
                      <span className='font-bold text-white whitespace-nowrap'>{m.name}</span>
                      <span className='text-[10px] text-neutral-400 font-mono whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded border border-white/5'>
                        {m.slug}
                      </span>
                      <span className='text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/50 whitespace-nowrap'>
                        ⚡ {m.latency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Value Proposition Highlights */}
          <div className='grid gap-3 pt-1'>
            <div className='flex gap-3.5 items-center p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/70 hover:border-neutral-700 transition-colors'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-lg'>
                🎁
              </div>
              <div className='space-y-0.5'>
                <h4 className='text-xs font-bold text-white flex items-center gap-2'>
                  100,000 API Tokens Welcome Pass
                  <span className='text-[10px] font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded'>Instant Access</span>
                </h4>
                <p className='text-neutral-400 text-xs leading-normal'>Start testing 20+ LLM requests immediately with zero KYC verification delays.</p>
              </div>
            </div>

            <div className='flex gap-3.5 items-center p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/70 hover:border-neutral-700 transition-colors'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg'>
                💳
              </div>
              <div className='space-y-0.5'>
                <h4 className='text-xs font-bold text-white flex items-center gap-2'>
                  PayPal & Global Card Billing
                  <span className='text-[10px] font-normal text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded'>PayPal Powered</span>
                </h4>
                <p className='text-neutral-400 text-xs leading-normal'>Top up effortlessly using PayPal, Stripe, Visa, Mastercard, or Crypto.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Metrics Footer */}
        <div className='flex items-center justify-between border-t border-neutral-900 pt-4 text-xs text-neutral-500 relative z-10'>
          <div className='flex items-center gap-4 text-neutral-400 font-medium'>
            <span className='flex items-center gap-1 text-emerald-400'>
              <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
              99.9% Uptime SLA
            </span>
            <span>•</span>
            <span>⚡ &lt; 150ms Avg Latency</span>
            <span>•</span>
            <span>💳 PayPal Supported</span>
          </div>
          <div>© {new Date().getFullYear()} APIVEL</div>
        </div>
      </div>

      {/* Right side form */}
      <div className='relative flex items-center justify-center pt-16 sm:pt-0 bg-neutral-950 lg:bg-transparent'>
        {/* Mobile Logo Link (only shown on mobile) */}
        <Link
          to='/'
          className='lg:hidden absolute top-4 left-4 z-10 flex items-center gap-2 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
        >
          <div className='relative h-8 w-8'>
            {loading ? (
              <Skeleton className='absolute inset-0 rounded-full' />
            ) : (
              <img
                src={(logo || '/logo.png') + '?v=2'}
                alt={t('Logo')}
                className='h-8 w-8 rounded-full object-cover'
              />
            )}
          </div>
          {loading ? (
            <Skeleton className='h-6 w-24' />
          ) : (
            <h1 className='text-xl font-medium text-white'>{systemName}</h1>
          )}
        </Link>
        <div className='container flex items-center justify-center'>
          <div className='mx-auto flex w-full flex-col justify-center space-y-2 px-4 py-8 sm:w-[480px] sm:p-8'>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

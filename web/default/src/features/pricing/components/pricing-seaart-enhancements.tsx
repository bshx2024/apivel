/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { Check, X, ShieldCheck, Zap, Users, Cpu, Star } from 'lucide-react'

/** 1. Trust Counters Bar (Quantified Social Proof) */
export function PricingTrustCountersBar() {
  const metrics = [
    { icon: ShieldCheck, value: '99.9%', label: 'Uptime SLA Guarantee', color: 'text-emerald-500' },
    { icon: Zap, value: '100M+', label: 'API Requests Served', color: 'text-blue-500' },
    { icon: Users, value: '999+', label: 'Verified Developers', color: 'text-amber-500' },
    { icon: Cpu, value: '40+', label: 'Aggregated AI Models', color: 'text-indigo-500' },
  ]

  return (
    <div className='my-8 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-5xl mx-auto'>
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <div
            key={m.label}
            className='flex items-center gap-3.5 rounded-2xl border border-border/40 bg-muted/20 p-4 backdrop-blur-sm shadow-xs hover:border-border/60 transition-all'
          >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted border border-border/40 ${m.color}`}>
              <Icon className='size-5' />
            </div>
            <div>
              <div className='text-xl font-extrabold tracking-tight text-foreground'>{m.value}</div>
              <div className='text-[11px] font-medium text-muted-foreground'>{m.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** 2. Why Choose APIVEL Comparison Table (SeaArt Style 🤩 vs 😨) */
export function PricingContrastTable() {
  const rows = [
    {
      feature: 'Onboarding & Activation',
      apivale: 'Instant Global Checkout & One-Click API Key Generation',
      regular: 'Complex Approval Processes & Multi-Day Onboarding',
    },
    {
      feature: 'Model Pricing Rate',
      apivale: 'Up to 60% Savings ($0.002/1k Tokens for DeepSeek-V4 Pro)',
      regular: 'Expensive Official List Rates with High Minimum Commitments',
    },
    {
      feature: 'High Availability & Routing',
      apivale: 'Intelligent Multi-Node Failover & 99.9% Uptime Guarantee',
      regular: 'Single Point of Failure & Unpredictable Provider Downtime',
    },
    {
      feature: 'TTFT Response Speed',
      apivale: 'Sub-second (< 0.5s) Priority Allocation & Zero Queue Delay',
      regular: 'Frequent Congestion, Peak Hours Queueing & Timeouts',
    },
    {
      feature: 'Credit Lifespan & Terms',
      apivale: 'Credits Never Expire (Pay-As-You-Go, No Forced Renewals)',
      regular: 'Monthly Forced Expiration & Auto-Renewal Lock-in',
    },
  ]

  return (
    <div className='my-12 max-w-5xl mx-auto space-y-6'>
      <div className='text-center space-y-2'>
        <span className='rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-500 border border-blue-500/20'>
          WHY CHOOSE APIVEL
        </span>
        <h2 className='text-2xl md:text-3xl font-extrabold tracking-tight text-foreground'>
          APIVEL Gateway vs Direct API & Traditional Proxies
        </h2>
        <p className='text-xs md:text-sm text-muted-foreground max-w-lg mx-auto'>
          See why over 999+ global developers choose APIVEL to power their production AI applications.
        </p>
      </div>

      <div className='overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-lg'>
        <div className='grid grid-cols-12 bg-muted/40 border-b border-border/40 text-xs font-extrabold uppercase tracking-wider p-4 text-muted-foreground'>
          <div className='col-span-4'>Feature / Comparison</div>
          <div className='col-span-4 text-blue-600 dark:text-blue-400 flex items-center gap-1.5'>
            <span>🤩 APIVEL Gateway</span>
          </div>
          <div className='col-span-4 text-muted-foreground/70 flex items-center gap-1.5'>
            <span>😨 Direct API / Standard Proxies</span>
          </div>
        </div>

        <div className='divide-y divide-border/20 text-xs'>
          {rows.map((row) => (
            <div key={row.feature} className='grid grid-cols-12 p-4 items-center gap-2 hover:bg-muted/10 transition-colors'>
              <div className='col-span-4 font-bold text-foreground'>{row.feature}</div>
              <div className='col-span-4 flex items-start gap-2 font-medium text-emerald-600 dark:text-emerald-400'>
                <Check className='size-4 text-emerald-500 shrink-0 mt-0.5' />
                <span>{row.apivale}</span>
              </div>
              <div className='col-span-4 flex items-start gap-2 text-muted-foreground/70'>
                <X className='size-4 text-rose-500/70 shrink-0 mt-0.5' />
                <span>{row.regular}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 3. Developers Social Proof Testimonials (9 Diverse Roles with Real Photo Avatars & Marquee) */
export function PricingDeveloperTestimonials() {
  const testimonials = [
    {
      name: 'Alex K.',
      role: 'Senior Full-Stack Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: 'Switching to APIVEL saved our startup 60%+ in API costs with blazingly fast DeepSeek-V4 response times and zero routing headaches.',
    },
    {
      name: 'Marcus Vance',
      role: 'AI Agent Founder',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      text: 'Instant PayPal checkout and unified API routing made integrating advanced AI models into our SaaS platform completely seamless.',
    },
    {
      name: 'Elena Rostova',
      role: 'Lead ML Architect',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      text: 'The sub-second TTFT response speed and 99.9% SLA uptime are unmatched by standard proxies. Highly recommended for production builds.',
    },
    {
      name: 'David Chen',
      role: 'Indie Hacker & Chrome Extension Dev',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      text: 'Pay-as-you-go credits with no expiration mean I can build and test micro-tools without monthly subscription lock-in pressure.',
    },
    {
      name: 'Sophia Al-Mansoor',
      role: 'Chief Technology Officer (FinTech)',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      text: 'Dedicated high-availability routing and high QPS concurrency limits allowed us to scale high-throughput analytics confidently.',
    },
    {
      name: 'Liam O\'Connor',
      role: 'Backend Specialist & Cloud Architect',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      text: 'APIVEL aggregated 40+ top AI providers behind one OpenAI-compatible endpoint. Swapping models requires zero backend refactoring.',
    },
    {
      name: 'Hiroshi Tanaka',
      role: 'DevOps Infrastructure Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      text: 'Automatic fallback and instant failover mean zero downtime for our customer-facing LLM agents during upstream provider outages.',
    },
    {
      name: 'Chloe Dubois',
      role: 'Generative AI Product Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      text: 'Having access to DeepSeek-V4, Qwen 3.7 Max, and Kimi K3 under a single key gave our product design team immense creative flexibility.',
    },
    {
      name: 'Siddharth Patel',
      role: 'Data Scientist & LLM Researcher',
      avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
      text: 'The billing expression system and real-time token tracking give us complete financial transparency for high-volume benchmark runs.',
    },
  ]

  // Double array to create a continuous infinite marquee loop
  const marqueeItems = [...testimonials, ...testimonials]

  return (
    <div className='my-14 max-w-[1400px] mx-auto space-y-6 overflow-hidden'>
      <div className='text-center space-y-2'>
        <span className='rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
          GLOBAL DEVELOPER TESTIMONIALS
        </span>
        <h2 className='text-xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2'>
          <span>📣 What Our 999+ Developers Say</span>
        </h2>
        <p className='text-xs md:text-sm text-muted-foreground max-w-xl mx-auto'>
          Loved by full-stack engineers, CTOs, AI agent founders, and researchers worldwide.
        </p>
      </div>

      {/* Infinite Right-to-Left Auto-Scrolling Carousel Container */}
      <div className='relative w-full overflow-hidden py-3 group'>
        {/* Left & Right Gradient Blur Fade Masks */}
        <div className='pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 md:w-32 bg-gradient-to-r from-background to-transparent' />
        <div className='pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 md:w-32 bg-gradient-to-l from-background to-transparent' />

        {/* Marquee Track */}
        <div className='flex w-max gap-4 animate-marquee-left group-hover:[animation-play-state:paused] transition-all duration-300'>
          {marqueeItems.map((t, idx) => (
            <div
              key={`${t.name}-${idx}`}
              className='w-[320px] md:w-[360px] flex flex-col justify-between shrink-0 rounded-2xl border border-border/40 bg-muted/20 p-5 backdrop-blur-sm shadow-xs space-y-4 hover:border-blue-500/50 hover:bg-muted/30 transition-all cursor-pointer'
            >
              <div className='space-y-3'>
                <div className='flex items-center gap-1 text-amber-500'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className='size-3.5 fill-current' />
                  ))}
                </div>
                <p className='text-xs text-muted-foreground leading-relaxed italic line-clamp-3'>
                  &quot;{t.text}&quot;
                </p>
              </div>

              <div className='flex items-center gap-3 pt-3 border-t border-border/20'>
                <img
                  src={t.avatarUrl}
                  alt={t.name}
                  className='size-10 shrink-0 rounded-full object-cover border border-border/50 shadow-sm'
                  loading='lazy'
                />
                <div className='min-w-0'>
                  <h4 className='text-xs font-bold text-foreground truncate'>{t.name}</h4>
                  <p className='text-[10px] text-muted-foreground/80 truncate'>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tailwind CSS inline keyframe definition style */}
      <style>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee-left {
          animation: marquee-left 35s linear infinite;
        }
      `}</style>
    </div>
  )
}

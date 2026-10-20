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
import { useCallback, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Check, Sparkles, Zap, CreditCard } from 'lucide-react'
import { SiPaypal } from 'react-icons/si'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import {
  LoadingSkeleton,
  EmptyState,
  SearchBar,
  PricingTable,
  PricingSidebar,
  PricingToolbar,
  ModelCardGrid,
  ModelDetailsDrawer,
  FreeTrialModal,
  PricingCalculatorFaq,
  OneClickCheckoutModal,
  QuickIntegrationModal,
  PricingStickyCtaBar,
  GlobalLatencyWidget,
  FlashTrioSpotlight,
} from './components'
import {
  PricingTrustCountersBar,
  PricingContrastTable,
  PricingDeveloperTestimonials,
} from './components/pricing-seaart-enhancements'
import { PaygCreditGrid, PAYG_TIERS } from './components/payg-credit-grid'
import type { CheckoutTier } from './components/one-click-checkout-modal'
import { usePricingData, useFilters } from './hooks'
import { EXCLUDED_GROUPS, VIEW_MODES } from './constants'
import { LivePlayground } from '@/features/home/components/sections/live-playground'

export function Pricing() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )
  const initialTab = useMemo<'plans' | 'payg' | 'models'>(() => {
    const queryTab = search?.tab as string | undefined
    if (queryTab === 'plans' || queryTab === 'payg' || queryTab === 'models') {
      return queryTab
    }
    return 'models'
  }, [search?.tab])

  const [activeTab, setActiveTab] = useState<'plans' | 'payg' | 'models'>(initialTab)

  const handleTabChange = useCallback(
    (newTab: 'plans' | 'payg' | 'models') => {
      setActiveTab(newTab)
      navigate({
        search: ((prev: Record<string, unknown>) => ({ ...prev, tab: newTab })) as any,
        replace: true,
      })
    },
    [navigate]
  )

  // Sync activeTab if search param changes
  useEffect(() => {
    if (search?.tab && (search.tab === 'plans' || search.tab === 'payg' || search.tab === 'models')) {
      setActiveTab(search.tab)
    }
  }, [search?.tab])

  const [selectedCheckoutTier, setSelectedCheckoutTier] = useState<CheckoutTier | null>(null)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false)
  const [integrationModelName, setIntegrationModelName] = useState<string | null>('deepseek-v4.1-flash')

  const handleQuickConnect = useCallback((modelName: string) => {
    setIntegrationModelName(modelName)
    setIntegrationModalOpen(true)
  }, [])

  // Auto trigger checkout modal if returning from auth flow with checkout search params
  useEffect(() => {
    if (auth.user && search) {
      const isCheckout = search.checkout === true || search.checkout === 'true'
      const rawCheckoutAmount = search.checkout_amount
      if (isCheckout && rawCheckoutAmount !== undefined && rawCheckoutAmount !== '') {
        const numAmount = Number(rawCheckoutAmount)
        if (!isNaN(numAmount) && numAmount > 0) {
          const matchedTier = PAYG_TIERS.find((tier) => Math.abs(tier.amountNum - numAmount) < 0.05) || {
            price: `$${numAmount}`,
            amountNum: numAmount,
            credits: `${numAmount * 500000} Credits`,
            bonus: 'SPECIAL OFFER',
          }
          setSelectedCheckoutTier(matchedTier)
          setCheckoutModalOpen(true)
        }
      }
    }
  }, [auth.user, search])

  const handleCheckoutTier = useCallback(
    (tier: CheckoutTier) => {
      setSelectedCheckoutTier(tier)
      setCheckoutModalOpen(true)
    },
    []
  )

  const {
    models,
    vendors,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const {
    searchInput,
    sortBy,
    vendorFilter,
    groupFilter,
    quotaTypeFilter,
    endpointTypeFilter,
    tagFilter,
    tokenUnit,
    viewMode,
    showRechargePrice,
    setSearchInput,
    setSortBy,
    setVendorFilter,
    setGroupFilter,
    setQuotaTypeFilter,
    setEndpointTypeFilter,
    setTagFilter,
    setTokenUnit,
    setViewMode,
    setShowRechargePrice,
    filteredModels,
    hasActiveFilters,
    activeFilterCount,
    availableTags,
    clearFilters,
    clearSearch,
  } = useFilters(models || [])

  const handleModelClick = useCallback((modelName: string) => {
    setSelectedModelName(modelName)
  }, [])

  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? (models || []).find(
            (model) => model.model_name === selectedModelName
          ) || null
        : null,
    [models, selectedModelName]
  )

  const availableGroups = useMemo(
    () =>
      Object.keys(usableGroup || {}).filter(
        (g) => !EXCLUDED_GROUPS.includes(g)
      ),
    [usableGroup]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
    clearSearch()
  }, [clearFilters, clearSearch])

  const renderPlansTab = () => {
    const plans = [
      {
        name: 'Quick Test',
        price: '$5',
        amountNum: 5,
        credits: '$7.50 Credits',
        bonus: '⚡ +50% BONUS INCL.',
        unitCost: '$1.66 / 1M',
        period: '· Never Expire',
        desc: 'Ideal test pack for latency & connectivity. Includes +50% first deposit compute bonus automatically.',
        valuePerception: '≈ 3,000,000 Tokens (DeepSeek-V4.1-Flash / GLM-5.3-Flash)',
        features: [
          '$7.50 Universal API Balance (Never Expire · +50% Bonus)',
          'Basic Concurrency (5 QPS)',
          'Instant PayPal & Credit Card Checkout',
          'Zero Chinese Phone / ID Required',
          'Standard global edge routing',
        ],
        cta: auth.user ? t('Purchase $5 Test Pack') : t('Sign Up for $5 Test Pack'),
        popular: false,
        badge: '⚡ +50% BONUS INCL.',
      },
      {
        name: 'Developer Starter',
        price: '$29',
        amountNum: 29,
        credits: '$43.50 Credits',
        bonus: '🔥 4X VALUE · +50% BONUS',
        unitCost: '$0.72 / 1M (56% Cheaper)',
        period: '· 30-Day VIP SLA',
        desc: 'Recommended starter pack for active developers with Claude Code & Cursor. Universal for GLM, DeepSeek & all models.',
        valuePerception: '≈ 40,000,000 Tokens (GLM, DeepSeek, Qwen, Kimi, MiniMax)',
        features: [
          '$43.50 Universal API Balance (Never Expire · +50% Bonus)',
          'Automatic VIP Group Upgrade',
          '30 QPS Standard High Concurrency',
          'All Models Universal (GLM, DeepSeek, Qwen, Kimi, MiniMax)',
          'Full Claude Code & Cursor Integration',
        ],
        cta: auth.user ? t('Get $29 Starter Pack') : t('Sign Up for $29 Pack'),
        popular: true,
        badge: '🔥 4X VALUE',
      },
      {
        name: 'Team Pro Growth',
        price: '$99',
        amountNum: 99,
        credits: '$148.50 Credits',
        bonus: '⚡ 69% OFF · TEAM PRO',
        unitCost: '$0.51 / 1M (69% Off Base Rate)',
        period: '· 30-Day VIP SLA',
        desc: 'For small teams and full-time developers running continuous agent pipelines.',
        valuePerception: '≈ 200M Tokens (Full Autonomous Coding & RAG)',
        features: [
          '$148.50 Universal API Balance (Never Expire · +50% Bonus)',
          'High Concurrency 30 QPS Cluster',
          'Multi-channel Failover Auto-routing',
          'Team Multi-key Sub-token Distribution',
          'Direct Kimi-K3 / GLM-5.3 / Doubao Support',
        ],
        cta: auth.user ? t('Get $99 Pro Pack') : t('Sign Up for $99 Pack'),
        popular: false,
      },
      {
        name: 'Scale Production',
        price: '$299',
        amountNum: 299,
        credits: '$299.00 Credits',
        bonus: '🚀 79% OFF · WHOLESALE',
        badge: '🚀 79% OFF',
        unitCost: '$0.35 / 1M (Wholesale Rate)',
        period: '· 30-Day VIP 60 QPS SLA',
        desc: 'For agency scaling, batch web scraping, and large-scale data processing.',
        valuePerception: '≈ 850M Tokens (Heavy Batch Agent & Enterprise Scaling)',
        features: [
          '$299.00 Universal API Balance (Never Expire)',
          'Wholesale $0.35/1M Tokens (79% Off Base Rate)',
          '60 QPS Dedicated Throughput Pipeline',
          'Sub-second TTFT Response Guarantee',
          'Automated Enterprise Invoices & Tax Receipts',
        ],
        cta: auth.user ? t('Get $299 Scale Pack') : t('Sign Up for $299 Pack'),
        popular: false,
      },
      {
        name: 'Enterprise Flagship',
        price: '$899',
        amountNum: 899,
        credits: '$899.00 Credits',
        bonus: '👑 100 QPS · VIP FLAGSHIP',
        badge: '👑 100 QPS VIP',
        unitCost: '$0.35 / 1M (🔥 Guaranteed Lowest)',
        period: '· 365-Day Flagship SLA',
        desc: 'Unlimited full-year team capacity with dedicated ultra-low latency relay SLA.',
        valuePerception: '≈ 2.5 Billion Tokens (Unlimited Team Year-round SLA)',
        features: [
          '$899.00 Universal API Balance (Never Expire)',
          'Lowest Wholesale Rate $0.35/1M (79% Off Base Rate)',
          '100 QPS Dedicated Ultra-High Concurrency',
          'Global Edge Low-Latency Relay (TTFT < 300ms)',
          '1-on-1 VIP SLA & Enterprise Tax Invoices',
        ],
        cta: auth.user ? t('Claim $899 Annual Pass') : t('Sign Up for Annual Pass'),
        popular: false,
      },
    ]

    return (
      <div className='space-y-8 max-w-[1800px] mx-auto mt-6'>
        {/* Looking for Pay-As-You-Go / Model Rates Guidance Banner */}
        <div className='mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-blue-500/25 bg-gradient-to-r from-blue-500/10 via-background to-emerald-500/10 p-4 text-xs shadow-xs'>
          <div className='flex items-center gap-2.5'>
            <span className='rounded-lg bg-blue-500/20 px-2 py-1 font-bold text-blue-600 dark:text-blue-400 shrink-0'>
              💡 {t('Prefer Custom Pay-As-You-Go?', '想要灵活按量付费？')}
            </span>
            <span className='text-muted-foreground leading-relaxed'>
              {t(
                'Top up starting from $5 with instant PayPal activation, or explore individual Chinese model rates per 1M tokens.',
                '支持低至 $5 起充，PayPal 即时开通，或查看千 token / 百万 token 单价表。'
              )}
            </span>
          </div>
          <div className='flex items-center gap-3 shrink-0 font-semibold pt-1 sm:pt-0'>
            <button
              type='button'
              onClick={() => handleTabChange('models')}
              className='text-blue-600 hover:underline dark:text-blue-400 cursor-pointer flex items-center gap-1'
            >
              <span>📊 {t('View Model Rates →', '查看模型单价 →')}</span>
            </button>
            <span className='text-border'>•</span>
            <button
              type='button'
              onClick={() => handleTabChange('payg')}
              className='text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer flex items-center gap-1'
            >
              <span>💳 {t('Credit Packs Grid →', '算力包总览 →')}</span>
            </button>
          </div>
        </div>

        <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-stretch'>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col justify-between rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300',
                plan.popular
                  ? 'border-2 border-blue-500 bg-gradient-to-b from-blue-500/10 via-background to-blue-500/5 shadow-[0_8px_30px_rgba(59,130,246,0.18)] ring-1 ring-blue-500/30 z-10'
                  : 'border-border/40 bg-muted/15 hover:border-border/70'
              )}
            >
              {plan.popular && (
                <span className='absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm'>
                  <Sparkles className='size-2.5' />
                  Most Popular
                </span>
              )}
              {plan.badge && !plan.popular && (
                <span className='absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm'>
                  {plan.badge}
                </span>
              )}
              <div className='flex-1 flex flex-col space-y-4'>
                <div>
                  <h3 className='text-lg font-bold'>{plan.name}</h3>
                  <p className='text-muted-foreground/80 mt-1.5 text-xs leading-relaxed h-[44px] flex items-start'>
                    {plan.desc}
                  </p>
                </div>
                <div className='flex items-baseline gap-1'>
                  <span className='text-3xl font-extrabold tracking-tight'>{plan.price}</span>
                  <span className='text-muted-foreground text-xs font-medium'>{plan.period}</span>
                </div>

                {/* Value Perception Badge for China AI Models */}
                <div className='rounded-xl bg-blue-500/10 border border-blue-500/20 p-2.5 text-[11px] leading-snug font-medium text-blue-600 dark:text-blue-400 min-h-[66px] flex flex-col justify-center'>
                  <span className='font-bold block mb-0.5'>💡 Estimated Model Capacity:</span>
                  <span>{plan.valuePerception}</span>
                </div>

                <ul className='space-y-2.5 pt-2 flex-1'>
                  {plan.features.map((feat) => (
                    <li key={feat} className='flex items-start gap-2.5 text-xs text-muted-foreground'>
                      <Check className='size-3.5 text-blue-500 shrink-0 mt-0.5' />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='mt-6 pt-4 border-t border-border/20 space-y-2.5'>
                <button
                  type='button'
                  onClick={() =>
                    handleCheckoutTier({
                      price: plan.price,
                      amountNum: plan.amountNum,
                      credits: plan.credits,
                      bonus: plan.bonus,
                      estimate: plan.valuePerception,
                      popular: plan.popular,
                    })
                  }
                  className={cn(
                    'inline-flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    plan.popular
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-muted/80 text-foreground hover:bg-muted border border-border/40'
                  )}
                >
                  {plan.cta}
                </button>
                {/* Dual Payment Options Badge: PayPal (Recommended) + Credit Card */}
                <div className='flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium pt-0.5'>
                  <span className='inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 font-bold text-blue-600 dark:text-blue-400'>
                    <SiPaypal className='size-3 text-[#003087] dark:text-[#0079C1] shrink-0' />
                    <span>PayPal {t('Recommended', '推荐')}</span>
                  </span>
                  <span className='inline-flex items-center gap-1 text-muted-foreground/80'>
                    <CreditCard className='size-3 shrink-0 text-muted-foreground' />
                    <span>Credit Card</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expiration & Custom Amount Banner Bar */}
        <div className='mx-auto max-w-4xl space-y-3 pt-2'>
          <div className='flex flex-wrap items-center justify-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-center shadow-sm backdrop-blur-sm'>
            <span>⚡ <strong>Credits Never Expire</strong> — No monthly auto-renewal lock-in. Pay as you go & test freely.</span>
          </div>

          <div className='text-center text-xs text-muted-foreground font-medium'>
            Need a custom credit amount? <Link to='/wallet' className='font-bold text-blue-500 hover:underline'>Top up any custom amount in your Wallet →</Link>
          </div>
        </div>

        {/* SeaArt Inspired 1: Quantified Trust Counters Bar */}
        <PricingTrustCountersBar />

        {/* SeaArt Inspired 2: Why Choose APIVEL Contrast Table (🤩 vs 😨) */}
        <PricingContrastTable />

        {/* SeaArt Inspired 3: Developer Social Proof Testimonials */}
        <PricingDeveloperTestimonials />

        {/* Compliance Footer notes */}
        <div className='border-border/30 rounded-xl border bg-muted/5 p-5 text-xs text-muted-foreground/80 space-y-2.5 max-w-3xl mx-auto'>
          <h4 className='font-bold text-foreground'>Important Billing & Access Disclosures</h4>
          <ul className='list-disc pl-4 space-y-1.5 leading-relaxed'>
            <li><strong>Subscription Cancellation:</strong> Customers can cancel future renewals at any time directly through their developer dashboard, or by contacting our billing support at <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>.</li>
            <li><strong>Consumption of Credits:</strong> API usage credits are consumed in real-time as API requests are processed by the gateway according to the individual model rates.</li>
            <li><strong>Taxes & checkout:</strong> Applicable local sales tax, VAT, or conversion charges are calculated and displayed at checkout before payment confirmation.</li>
            <li><strong>Refund Policy:</strong> All subscription purchases are governed by our standard 7-day refund window for unused services. Please review our full <Link to='/refund' className='text-blue-500 hover:underline'>Refund Policy</Link> for details.</li>
            <li><strong>Model Availability:</strong> Downstream models and upstream routing limits are subject to availability. Higher concurrency caps may require brief verification checkouts.</li>
          </ul>
        </div>
      </div>
    )
  }

  const renderPricingContent = () => {
    if (filteredModels.length === 0) {
      return (
        <EmptyState
          searchQuery={searchInput}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
      )
    }

    if (viewMode === VIEW_MODES.CARD) {
      return (
        <ModelCardGrid
          models={filteredModels}
          onModelClick={handleModelClick}
          onQuickConnect={handleQuickConnect}
          priceRate={priceRate}
          usdExchangeRate={usdExchangeRate}
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
        />
      )
    }

    return (
      <PricingTable
        models={filteredModels}
        priceRate={priceRate}
        usdExchangeRate={usdExchangeRate}
        tokenUnit={tokenUnit}
        showRechargePrice={showRechargePrice}
        onModelClick={handleModelClick}
        onQuickConnect={handleQuickConnect}
      />
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-20 dark:opacity-[0.10]'
          style={{
            background: [
              'radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.15 200 / 60%) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 35% at 50% 70%, oklch(0.70 0.12 280 / 40%) 0%, transparent 70%)',
            ].join(', '),
            maskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />
        <PageTransition className='relative mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          {!auth.user && (
            <div className='mx-auto max-w-3xl mb-8 p-4 bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-purple-500/15 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-lg shadow-blue-500/10'>
              <div className='flex items-center gap-3 text-left'>
                <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-500 dark:text-blue-400'>
                  <Zap className='size-5 text-amber-400 fill-amber-400' />
                </span>
                <div>
                  <h4 className='text-sm sm:text-base font-bold text-foreground flex items-center gap-2 flex-wrap'>
                    <span>⚡ {t('pricing_zero_card_tag', 'Zero Card Required: Sign up in 5s & get $0.20 free credit')}</span>
                    <span className='rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 border border-emerald-500/30'>
                      100,000 Tokens
                    </span>
                  </h4>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {t('pricing_zero_card_sub', 'Test DeepSeek-V4.1 Flash, GLM-5.3 & Qwen 3.8 immediately without entering credit card details. Plus get automatic +50% bonus on your first top-up.')}
                  </p>
                </div>
              </div>
              <Link
                to='/sign-up'
                search={{ redirect: '/pricing' }}
                className='shrink-0 inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap'
              >
                {t('pricing_claim_cta', 'Claim $0.20 Free Credits →')}
              </Link>
            </div>
          )}
          <header className='mx-auto mb-5 max-w-3xl pt-5 text-center sm:mb-8 sm:pt-10'>
            <p className='text-blue-500 dark:text-blue-400 mb-3 text-xs font-semibold tracking-widest uppercase'>
              {t('China Top AI Gateway', 'China Top AI Models Gateway')}
            </p>
            <h1 className='text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.15] font-bold tracking-tight'>
              Plans & Model Directory
            </h1>
            <p className='text-muted-foreground/80 mt-3 text-sm sm:mt-4 sm:text-base leading-relaxed'>
              Access China's top-tier AI models (DeepSeek-V4.1 Flash, DeepSeek-V4 Pro, GLM-5.3 Flash, Qwen-3.8 Max, Kimi K3) with enterprise SLA, sub-second latency, and instant global PayPal checkout.
            </p>

            {/* SLA & Trust Badges */}
            <div className='mx-auto mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground'>
              <span className='inline-flex items-center gap-1 bg-muted/40 border border-border/40 px-2.5 py-1 rounded-full font-medium'>
                🛡️ 99.9% Uptime SLA
              </span>
              <span className='inline-flex items-center gap-1 bg-muted/40 border border-border/40 px-2.5 py-1 rounded-full font-medium'>
                ⚡ Sub-second TTFT Response
              </span>
              <span className='inline-flex items-center gap-1 bg-muted/40 border border-border/40 px-2.5 py-1 rounded-full font-medium'>
                💳 Instant Credit Card / Global Checkout
              </span>
              <span className='inline-flex items-center gap-1 bg-muted/40 border border-border/40 px-2.5 py-1 rounded-full font-medium'>
                🔒 7-Day Money-Back Guarantee
              </span>
            </div>

            {/* Live Global Latency Widget */}
            <div className='mx-auto mt-3 max-w-xl'>
              <GlobalLatencyWidget />
            </div>

            {/* SeaArt Style 3-Segmented Tabs Selector */}
            <div className='mx-auto mt-6 flex max-w-xl items-center justify-center rounded-xl border border-border/40 bg-muted/20 p-1 backdrop-blur-sm shadow-xs'>
              <button
                type='button'
                onClick={() => handleTabChange('models')}
                className={cn(
                  'w-1/3 rounded-lg py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer text-center',
                  activeTab === 'models'
                    ? 'bg-background text-foreground shadow-sm ring-[0.5px] ring-border/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                📊 Model Rates
              </button>

              <button
                type='button'
                onClick={() => handleTabChange('payg')}
                className={cn(
                  'w-1/3 rounded-lg py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer text-center',
                  activeTab === 'payg'
                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-sm ring-[0.5px] ring-border/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                💳 Pay-As-You-Go <span className='text-[10px] opacity-80'>($1起 +50%)</span>
              </button>

              <button
                type='button'
                onClick={() => handleTabChange('plans')}
                className={cn(
                  'w-1/3 rounded-lg py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer text-center',
                  activeTab === 'plans'
                    ? 'bg-background text-blue-600 dark:text-blue-400 shadow-sm ring-[0.5px] ring-border/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                🔥 Developer Packs <span className='text-[10px] opacity-80'>(-34%)</span>
              </button>
            </div>
          </header>

          {activeTab === 'plans' ? (
            renderPlansTab()
          ) : activeTab === 'payg' ? (
            <PaygCreditGrid onSelectTier={handleCheckoutTier} />
          ) : isLoading ? (
            <div className='mt-8'>
              <LoadingSkeleton viewMode={viewMode} />
            </div>
          ) : (
            <>
              {/* Zero-Login Live Demo Playground Showcase for Pricing Visitors */}
              {!auth.user && (
                <div className='mb-8 space-y-3 max-w-4xl mx-auto'>
                  <div className='flex items-center justify-between px-1'>
                    <div className='flex items-center gap-2'>
                      <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                      <h3 className='text-sm md:text-base font-bold text-foreground flex items-center gap-1.5'>
                        <span>⚡ {t('Instant Live Test (No Login Required)', '免登录极速实测')}</span>
                      </h3>
                      <span className='text-xs text-muted-foreground hidden sm:inline'>
                        — {t('Test real-time latency & response quality across DeepSeek, Qwen & GLM', '实时对比 DeepSeek、Qwen 与 GLM 生成质量与延迟')}
                      </span>
                    </div>
                    <Link
                      to='/sign-up'
                      search={{ redirect: '/pricing' }}
                      className='text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1 cursor-pointer'
                    >
                      <span>🎁 {t('Get 100,000 Free Tokens →', '注册免费领 100,000 额度 →')}</span>
                    </Link>
                  </div>
                  <LivePlayground redirectSource='/pricing' />
                </div>
              )}

              {/* Flash Trio Spotlight Section */}
              <FlashTrioSpotlight
                onQuickConnect={handleQuickConnect}
                onOpenCheckout={(amount) => {
                  const tier = PAYG_TIERS.find((t) => t.amountNum === amount) || PAYG_TIERS[0]
                  handleCheckoutTier(tier)
                }}
              />

              <header className='mx-auto mb-6 max-w-3xl text-center relative z-10 space-y-3 mt-4'>
                <div className='inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3.5 py-1 text-xs text-muted-foreground'>
                  <span>🔥 {t('Need bundled volume discounts?', '需要大额折扣套餐？')}</span>
                  <button
                    type='button'
                    onClick={() => handleTabChange('plans')}
                    className='font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer'
                  >
                    {t('Check Developer Packs (-34%) →', '查看开发者折扣套餐 (-34%) →')}
                  </button>
                  <span className='text-border'>•</span>
                  <button
                    type='button'
                    onClick={() => handleTabChange('payg')}
                    className='font-bold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer'
                  >
                    {t('Pay-As-You-Go ($1+) →', '按量预充值 ($1起) →')}
                  </button>
                </div>

                <p className='text-muted-foreground/80 text-sm font-medium'>
                  {t('This site currently has {{count}} models enabled', {
                    count: models?.length || 0,
                  })}
                </p>
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onClear={clearSearch}
                  placeholder={t(
                    'Search model name, provider, endpoint, or tag...'
                  )}
                  className='mx-auto mt-4 max-w-2xl'
                />
              </header>

              <div className='grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]'>
                <PricingSidebar
                  quotaTypeFilter={quotaTypeFilter}
                  endpointTypeFilter={endpointTypeFilter}
                  vendorFilter={vendorFilter}
                  groupFilter={groupFilter}
                  tagFilter={tagFilter}
                  onQuotaTypeChange={setQuotaTypeFilter}
                  onEndpointTypeChange={setEndpointTypeFilter}
                  onVendorChange={setVendorFilter}
                  onGroupChange={setGroupFilter}
                  onTagChange={setTagFilter}
                  vendors={vendors || []}
                  groups={availableGroups}
                  groupRatios={groupRatio}
                  tags={availableTags}
                  models={models || []}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                  className='hover-scrollbar sticky top-4 hidden max-h-[calc(100dvh-2rem)] self-start overflow-y-auto xl:block'
                />

                <main className='min-w-0 space-y-4'>
                  <PricingToolbar
                    filteredCount={filteredModels.length}
                    totalCount={models?.length}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    tokenUnit={tokenUnit}
                    onTokenUnitChange={setTokenUnit}
                    showRechargePrice={showRechargePrice}
                    onRechargePriceChange={setShowRechargePrice}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    quotaTypeFilter={quotaTypeFilter}
                    endpointTypeFilter={endpointTypeFilter}
                    vendorFilter={vendorFilter}
                    groupFilter={groupFilter}
                    tagFilter={tagFilter}
                    onQuotaTypeChange={setQuotaTypeFilter}
                    onEndpointTypeChange={setEndpointTypeFilter}
                    onVendorChange={setVendorFilter}
                    onGroupChange={setGroupFilter}
                    onTagChange={setTagFilter}
                    vendors={vendors || []}
                    groups={availableGroups}
                    groupRatios={groupRatio}
                    tags={availableTags}
                    models={models || []}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onClearFilters={clearFilters}
                  />

                  {renderPricingContent()}
                </main>
              </div>
            </>
          )}

          <PricingCalculatorFaq models={models} groupRatio={groupRatio} />

          {selectedModel && (
            <ModelDetailsDrawer
              open={Boolean(selectedModel)}
              onOpenChange={(open) => {
                if (!open) setSelectedModelName(null)
              }}
              model={selectedModel}
              groupRatio={groupRatio || {}}
              usableGroup={(usableGroup as any) || {}}
              endpointMap={
                (endpointMap as Record<
                  string,
                  { path?: string; method?: string }
                >) || {}
              }
              autoGroups={autoGroups || []}
              priceRate={priceRate ?? 1}
              usdExchangeRate={usdExchangeRate ?? 1}
              tokenUnit={tokenUnit}
              showRechargePrice={showRechargePrice}
            />
          )}

          <FreeTrialModal />
          <OneClickCheckoutModal
            open={checkoutModalOpen}
            onOpenChange={setCheckoutModalOpen}
            tier={selectedCheckoutTier}
          />
          <QuickIntegrationModal
            open={integrationModalOpen}
            onOpenChange={setIntegrationModalOpen}
            modelName={integrationModelName}
          />
          <PricingStickyCtaBar
            onOpenCheckout={handleCheckoutTier}
            onOpenConnect={() => handleQuickConnect('deepseek-v4.1-flash')}
          />
        </PageTransition>
      </div>
    </PublicLayout>
  )
}


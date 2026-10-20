/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { HelpCircle, Calculator, ChevronDown, Coins, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PricingModel } from '../types'

interface PricingCalculatorFaqProps {
  models?: PricingModel[]
  groupRatio?: Record<string, number>
}

// Popular models to fall back to if models are not loaded
const POPULAR_MODELS = [
  { model_name: 'gpt-4o', model_ratio: 1.25, completion_ratio: 4, vendor: 'OpenAI' },
  { model_name: 'gpt-5.5', model_ratio: 1.5, completion_ratio: 3, vendor: 'OpenAI' },
  { model_name: 'claude-opus-4.8', model_ratio: 7.5, completion_ratio: 5, vendor: 'Anthropic' },
  { model_name: 'gemini-3.5-flash', model_ratio: 0.0375, completion_ratio: 4, vendor: 'Google' },
  { model_name: 'deepseek-v4-pro', model_ratio: 0.07, completion_ratio: 2, vendor: 'DeepSeek' },
]

/** Secondary Quick-Purchase Plan Callout Bar (Placed right above FAQ) */
function SecondaryPlanCalloutBar() {
  const quickPlans = [
    { name: 'Quick Test Pack', price: '$5.00', bonus: '3.0M Credits', href: '/wallet?amount=5&auto_pay=true', highlight: false },
    { name: 'Developer Starter', price: '$29.00', bonus: '🔥 40M Credits (4X Value)', href: '/wallet?amount=29&auto_pay=true', highlight: true },
    { name: 'Team Pro Growth', price: '$99.00', bonus: '⭐ 200M Credits', href: '/wallet?amount=99&auto_pay=true', highlight: false },
    { name: 'Annual Flagship', price: '$899.00', bonus: '👑 2.5B Tokens (Full Year)', href: '/wallet?amount=899&auto_pay=true', highlight: false },
  ]

  return (
    <div className='my-10 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-6 md:p-8 backdrop-blur-md shadow-xl space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4 border-b border-border/20 pb-5'>
        <div>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-bold text-blue-500 border border-blue-500/30 mb-2'>
            <Zap className='size-3.5' />
            <span>READY TO GET STARTED?</span>
          </div>
          <h3 className='text-xl md:text-2xl font-extrabold tracking-tight text-foreground'>
            Select a Pack & Top Up Instantly
          </h3>
          <p className='text-xs text-muted-foreground mt-1'>
            No monthly auto-renewal lock-in. Credits never expire and support instant PayPal & Credit Card checkout.
          </p>
        </div>
        <div className='flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full'>
          <ShieldCheck className='size-4' />
          <span>7-Day Money-Back Guarantee</span>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {quickPlans.map((qp) => (
          <div
            key={qp.name}
            className={cn(
              'flex flex-col justify-between rounded-2xl border p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]',
              qp.highlight
                ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'border-border/40 bg-muted/20 hover:border-border/60'
            )}
          >
            <div className='space-y-1.5'>
              <div className='flex justify-between items-center text-xs font-bold'>
                <span className='text-foreground'>{qp.name}</span>
                <span className='rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-extrabold'>
                  {qp.bonus}
                </span>
              </div>
              <div className='text-2xl font-extrabold tracking-tight text-foreground'>{qp.price}</div>
            </div>

            <Link
              to={qp.href}
              className={cn(
                'mt-4 inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs',
                qp.highlight
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-muted/80 text-foreground hover:bg-muted border border-border/40'
              )}
            >
              <span>Instant Pay {qp.price}</span>
              <ArrowRight className='size-3.5' />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PricingCalculatorFaq({ models = [], groupRatio = {} }: PricingCalculatorFaqProps) {
  const { t } = useTranslation()

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0) // Default first item open

  // Calculator State
  const [monthlyRequests, setMonthlyRequests] = useState<number>(50000)
  const [promptTokens, setPromptTokens] = useState<number>(1000)
  const [completionTokens, setCompletionTokens] = useState<number>(500)

  // Extract valid token-based models from database, otherwise fallback to popular
  const calculatorModels = useMemo(() => {
    const list = models.filter((m) => m.quota_type === 0)
    if (list.length > 0) return list.slice(0, 15) // Limit to top 15 models
    
    // Map static popular models to the PricingModel structure
    return POPULAR_MODELS.map((pm, idx) => ({
      id: idx,
      model_name: pm.model_name,
      model_ratio: pm.model_ratio,
      completion_ratio: pm.completion_ratio,
      quota_type: 0,
      enable_groups: ['default'],
      vendor_name: pm.vendor,
    })) as PricingModel[]
  }, [models])

  const [selectedModelName, setSelectedModelName] = useState<string>(
    calculatorModels[0]?.model_name || 'gpt-4o'
  )

  const selectedModel = useMemo(() => {
    return calculatorModels.find((m) => m.model_name === selectedModelName) || calculatorModels[0]
  }, [calculatorModels, selectedModelName])

  // Pricing calculation
  const calculations = useMemo(() => {
    if (!selectedModel) {
      return {
        inputPricePerMillion: 0,
        outputPricePerMillion: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
      }
    }

    // Ratios
    const ratio = groupRatio['default'] || 1
    const baseInputPerMillion = selectedModel.model_ratio * 2 * ratio // price per 1M tokens in USD
    const baseOutputPerMillion = baseInputPerMillion * (selectedModel.completion_ratio || 1)

    const totalInputTokens = (monthlyRequests * promptTokens) / 1000000
    const totalOutputTokens = (monthlyRequests * completionTokens) / 1000000

    const inputCost = totalInputTokens * baseInputPerMillion
    const outputCost = totalOutputTokens * baseOutputPerMillion
    const totalCost = inputCost + outputCost

    return {
      inputPricePerMillion: baseInputPerMillion,
      outputPricePerMillion: baseOutputPerMillion,
      inputCost,
      outputCost,
      totalCost,
    }
  }, [selectedModel, groupRatio, monthlyRequests, promptTokens, completionTokens])

  const faqItems = [
    {
      q: t('faq_free_trial_q', '🎁 Is there a free trial quota for new users?'),
      a: t('faq_free_trial_a', 'Yes! When you register using your GitHub or Google account, the platform automatically grants a $0.20 free welcome credit (equivalent to approximately 100,000 developer tokens) so you can test model responses immediately.'),
    },
    {
      q: t('faq_credit_card_q', '💳 How does the prepaid balance model work?'),
      a: t('faq_credit_card_a', 'We run on a transparent pay-as-you-go balance model. You only pay for the exact volume of tokens your applications process, with no hidden fees or surprise overages.'),
    },
    {
      q: t('faq_invoices_q', '🧾 Can I get formal invoices or VAT tax receipts?'),
      a: t('faq_invoices_q_a', 'Yes! You can generate downloadable invoices and VAT payment receipts directly inside your Console -> Billing tab for accounting and tax deduction purposes.'),
    },
    {
      q: t('faq_refund_q', '🛡️ What is your 7-Day Refund and Money-Back Policy?'),
      a: t('faq_refund_q_a', 'We offer a hassle-free 7-day money-back guarantee for unused API credits. If you are unsatisfied with gateway performance, simply contact support@apivel.com for an immediate refund.'),
    },
    {
      q: t('faq_cancellation_q', '🔓 Can I cancel my subscription or stop top-ups anytime?'),
      a: t('faq_cancellation_q_a', 'Absolutely. APIVEL operates on pay-as-you-go credits that never expire. There are no recurring lock-ins, and you can pause or discontinue usage at any time with zero penalty.'),
    },
    {
      q: t('faq_payment_troubleshooting_q', '💳 What should I do if my payment or PayPal checkout fails?'),
      a: t('faq_payment_troubleshooting_q_a', 'If your card or PayPal transaction is rejected by regional bank rules, please try selecting standard credit card checkout, or reach out to our 24/7 billing support team for instant manual balance top-up assistance.'),
    },
    {
      q: t('faq_latency_q', '⚡ What are the typical API latency and response speeds?'),
      a: t('faq_latency_q_a', 'Our gateway routes requests across high-performance regional endpoints. For streaming completions, the Time To First Token (TTFT) is optimized to sub-second levels (typically 500ms - 1.2s depending on the model tier), providing a highly responsive experience for your users.'),
    },
    {
      q: t('faq_billing_q', '📊 How is my usage billed and tracked?'),
      a: t('faq_billing_q_a', 'API calls are billed in real-time based on exact token consumption. You can inspect the detailed token count, routing channel, and cost of every request inside your Console -> Logs tab.'),
    },
    {
      q: t('faq_no_balance_q', '🔒 What happens if my account balance runs out?'),
      a: t('faq_no_balance_q_a', 'Requests will temporarily fail with an insufficient balance error. There are no fees or penalties; you can instantly top up your balance via our secure PayPal gateway to resume calls.'),
    },
  ]

  return (
    <div className='mt-16 border-t border-border/40 pt-16 space-y-16 max-w-6xl mx-auto'>
      
      {/* Secondary Quick-Purchase Plan Callout Bar (Placed right above FAQ) */}
      <SecondaryPlanCalloutBar />

      {/* Grid: Calculator & FAQ */}
      <div className='grid gap-12 lg:grid-cols-12 items-start'>
        
        {/* Left Side: Calculator (7 cols) */}
        <div className='lg:col-span-7 bg-card border border-border/40 rounded-2xl p-6 sm:p-8 relative shadow-lg backdrop-blur-md'>
          <div aria-hidden className='pointer-events-none absolute -top-12 -left-12 size-36 rounded-full bg-blue-500/5 blur-2xl' />
          
          <div className='flex items-center gap-3 mb-6'>
            <span className='flex size-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500'>
              <Calculator className='size-5' />
            </span>
            <div>
              <h3 className='text-lg font-bold'>{t('API Cost Estimator')}</h3>
              <p className='text-xs text-muted-foreground'>{t('Estimate your monthly expenses based on usage')}</p>
            </div>
          </div>

          <div className='space-y-6'>
            {/* Model Selector */}
            <div className='space-y-2'>
              <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>{t('Select Model')}</label>
              <select
                value={selectedModelName}
                onChange={(e) => setSelectedModelName(e.target.value)}
                className='w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50'
              >
                {calculatorModels.map((m) => (
                  <option key={m.model_name} value={m.model_name}>
                    {m.model_name} ({m.vendor_name || 'API'})
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Requests */}
            <div className='space-y-2.5'>
              <div className='flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <span>{t('Monthly Requests')}</span>
                <span className='text-foreground font-mono text-sm bg-muted/40 px-2 py-0.5 rounded'>
                  {monthlyRequests.toLocaleString()}
                </span>
              </div>
              <input
                type='range'
                min='1000'
                max='1000000'
                step='1000'
                value={monthlyRequests}
                onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                className='w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500'
              />
              <div className='flex justify-between text-[10px] text-muted-foreground'>
                <span>1K</span>
                <span>500K</span>
                <span>1M</span>
              </div>
            </div>

            {/* Prompt Tokens */}
            <div className='space-y-2.5'>
              <div className='flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <span>{t('Average Input Tokens (Prompt)')}</span>
                <span className='text-foreground font-mono text-sm bg-muted/40 px-2 py-0.5 rounded'>
                  {promptTokens.toLocaleString()} {t('tokens')}
                </span>
              </div>
              <input
                type='range'
                min='100'
                max='16000'
                step='100'
                value={promptTokens}
                onChange={(e) => setPromptTokens(Number(e.target.value))}
                className='w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500'
              />
              <div className='flex justify-between text-[10px] text-muted-foreground'>
                <span>100</span>
                <span>8K</span>
                <span>16K</span>
              </div>
            </div>

            {/* Completion Tokens */}
            <div className='space-y-2.5'>
              <div className='flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <span>{t('Average Output Tokens (Response)')}</span>
                <span className='text-foreground font-mono text-sm bg-muted/40 px-2 py-0.5 rounded'>
                  {completionTokens.toLocaleString()} {t('tokens')}
                </span>
              </div>
              <input
                type='range'
                min='100'
                max='8000'
                step='100'
                value={completionTokens}
                onChange={(e) => setCompletionTokens(Number(e.target.value))}
                className='w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500'
              />
              <div className='flex justify-between text-[10px] text-muted-foreground'>
                <span>100</span>
                <span>4K</span>
                <span>8K</span>
              </div>
            </div>

            {/* Output Panel */}
            <div className='mt-8 rounded-2xl bg-blue-500/5 border border-blue-500/20 p-5 space-y-4'>
              <div className='flex justify-between items-baseline'>
                <span className='text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider'>{t('Estimated Monthly Cost')}</span>
                <span className='text-3xl font-extrabold tracking-tight text-foreground'>
                  ${calculations.totalCost.toFixed(2)}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-4 pt-3 border-t border-blue-500/10 text-xs'>
                <div>
                  <span className='text-muted-foreground block'>{t('Input Token Cost')}</span>
                  <span className='font-mono font-medium text-foreground'>${calculations.inputCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className='text-muted-foreground block'>{t('Output Token Cost')}</span>
                  <span className='font-mono font-medium text-foreground'>${calculations.outputCost.toFixed(2)}</span>
                </div>
              </div>

              <div className='text-[10px] text-muted-foreground/80 flex items-center gap-1.5 pt-1.5'>
                <Coins className='size-3 text-blue-500' />
                <span>
                  {t('Based on default tier rates')}: ${calculations.inputPricePerMillion.toFixed(2)}/1M input, ${calculations.outputPricePerMillion.toFixed(2)}/1M output.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: FAQ (5 cols) */}
        <div className='lg:col-span-5 space-y-6'>
          <div className='flex items-center gap-3'>
            <span className='flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500'>
              <HelpCircle className='size-5' />
            </span>
            <div>
              <h3 className='text-lg font-bold'>{t('Developer FAQ')}</h3>
              <p className='text-xs text-muted-foreground'>{t('Transparent answers to common billing and trial questions')}</p>
            </div>
          </div>

          <div className='space-y-3.5'>
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className='rounded-xl border border-border/40 bg-card overflow-hidden transition-all duration-200 shadow-sm'
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className='w-full px-4 py-3.5 text-left flex justify-between items-center gap-4 hover:bg-muted/10 transition-colors'
                  >
                    <span className='text-xs font-semibold text-foreground/90'>{item.q}</span>
                    <ChevronDown
                      className={cn(
                        'size-4 text-muted-foreground transition-transform duration-200 shrink-0',
                        isOpen && 'rotate-180 text-blue-500'
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'grid transition-all duration-200 ease-in-out',
                      isOpen ? 'grid-rows-[1fr] opacity-100 border-t border-border/20' : 'grid-rows-[0fr] opacity-0'
                    )}
                  >
                    <div className='overflow-hidden'>
                      <p className='px-4 py-3.5 text-xs text-muted-foreground leading-relaxed bg-muted/5'>
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

    </div>
  )
}

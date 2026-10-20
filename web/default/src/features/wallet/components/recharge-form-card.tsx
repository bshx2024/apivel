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
import { useState, useEffect, useMemo } from 'react'
import { Gift, ExternalLink, Loader2, Receipt, WalletCards, CreditCard, ShieldCheck, Lock, Zap } from 'lucide-react'
import { SiPaypal } from 'react-icons/si'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  formatCurrency,
  getDiscountLabel,
  getPaymentIcon,
  getMinTopupAmount,
} from '../lib'
import type {
  PaymentMethod,
  PresetAmount,
  TopupInfo,
  CreemProduct,
  WaffoPayMethod,
} from '../types'
import { CreemProductsSection } from './creem-products-section'

interface RechargeFormCardProps {
  topupInfo: TopupInfo | null
  presetAmounts: PresetAmount[]
  selectedPreset: number | null
  onSelectPreset: (preset: PresetAmount) => void
  topupAmount: number
  onTopupAmountChange: (amount: number) => void
  paymentAmount: number
  calculating: boolean
  onPaymentMethodSelect: (method: PaymentMethod) => void
  paymentLoading: string | null
  redemptionCode: string
  onRedemptionCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
  topupLink?: string
  loading?: boolean
  priceRatio?: number
  usdExchangeRate?: number
  onOpenBilling?: () => void
  creemProducts?: CreemProduct[]
  enableCreemTopup?: boolean
  onCreemProductSelect?: (product: CreemProduct) => void
  enableWaffoTopup?: boolean
  waffoPayMethods?: WaffoPayMethod[]
  waffoMinTopup?: number
  onWaffoMethodSelect?: (method: WaffoPayMethod, index: number) => void
  enableWaffoPancakeTopup?: boolean
  selectedPaymentMethod?: PaymentMethod
  quotaDisplayType?: string
  rawUsdExchangeRate?: number
  processing?: boolean
}

function FlashSaleCountdownBanner() {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 15 * 60))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`

  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-red-500/15 via-orange-500/10 to-amber-500/15 border border-red-500/30 p-3 text-xs shadow-xs backdrop-blur-sm'>
      <div className='flex items-center gap-2 font-bold text-red-600 dark:text-red-400'>
        <span className='animate-pulse text-base'>🎁</span>
        <span>
          {t(
            'First Deposit Privilege: Automatically Get +50% Extra Compute Credits! (Deposit $1.99 ➔ Get $3.00 | Deposit $4.99 ➔ Get $7.50 | Deposit $29 ➔ Get $43.50 | Wholesale up to 79% OFF)'
          )}
        </span>
      </div>
      <div className='flex items-center gap-1.5 font-mono text-xs font-extrabold text-foreground bg-background/80 px-2.5 py-1 rounded-md border border-red-500/20 shadow-inner'>
        <span className='text-muted-foreground font-sans text-[11px] font-normal'>{t('Ends In')}</span>
        <span className='text-red-500 font-bold'>[ {formattedTime} ]</span>
      </div>
    </div>
  )
}

function PayPalTrustBadges() {
  const { t } = useTranslation()
  return (
    <div className='mt-3.5 space-y-2 rounded-xl bg-muted/40 border border-border/40 p-3 text-xs'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 text-xs'>
          <span>🛡️ {t('Verified Global Payment Channel')}</span>
          <span className='text-muted-foreground'>•</span>
          <span className='text-foreground font-bold'>✅ {t('999+ Verified Buyers')}</span>
        </div>
        <span className='rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400'>
          {t('Instant 0-Delay Activation')}
        </span>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground/80 border-t border-border/20'>
        <div className='flex items-center gap-3 flex-wrap'>
          <span>💳 Visa / Mastercard / Amex</span>
          <span>🛡️ {t('PayPal Buyer Protection')}</span>
          <span>🔒 {t('256-Bit Bank-Grade SSL')}</span>
          <span>⚡ {t('Credits Never Expire')}</span>
        </div>
        <span className='text-muted-foreground/90 font-medium'>
          🏢 {t('Automated Invoices & Team Billing Supported')}
        </span>
      </div>
    </div>
  )
}

const getTierMeta = (
  value: number,
  t: (key: string) => string
): {
  displayAmount: string
  tag: string
  badgeClass: string
  tokens: string
  bonusCredit: string
} | null => {
  switch (value) {
    case 2:
      return {
        displayAmount: '1.99',
        tag: t('⚡ Starter'),
        badgeClass:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 font-semibold',
        tokens: t('≈ 1.5M Tokens'),
        bonusCredit: t('Get $3.00 (+50%)'),
      }
    case 5:
      return {
        displayAmount: '4.99',
        tag: t('⚡ Quick Test'),
        badgeClass:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-semibold',
        tokens: t('≈ 3.5M Tokens'),
        bonusCredit: t('Get $7.50 (+50%)'),
      }
    case 29:
      return {
        displayAmount: '29',
        tag: t('🔥 56% OFF · POPULAR'),
        badgeClass:
          'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold',
        tokens: t('≈ 40M Tokens'),
        bonusCredit: t('Get $43.50 (+50%)'),
      }
    case 99:
      return {
        displayAmount: '99',
        tag: t('⚡ 69% OFF'),
        badgeClass:
          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold',
        tokens: t('≈ 200M Tokens'),
        bonusCredit: t('Get $148.50 (+50%)'),
      }
    case 299:
      return {
        displayAmount: '299',
        tag: t('🚀 79% OFF'),
        badgeClass:
          'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-semibold',
        tokens: t('≈ 850M Tokens'),
        bonusCredit: t('Wholesale $0.35/1M'),
      }
    case 899:
      return {
        displayAmount: '899',
        tag: t('👑 100 QPS · VIP'),
        badgeClass:
          'bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold',
        tokens: t('≈ 2.5B Tokens'),
        bonusCredit: t('Dedicated Edge SLA'),
      }
    default:
      return null
  }
}

export function RechargeFormCard({
  topupInfo,
  presetAmounts,
  selectedPreset,
  onSelectPreset,
  topupAmount,
  onTopupAmountChange,
  paymentAmount,
  calculating,
  onPaymentMethodSelect,
  paymentLoading,
  redemptionCode,
  onRedemptionCodeChange,
  onRedeem,
  redeeming,
  topupLink,
  loading,
  priceRatio = 1,
  usdExchangeRate = 1,
  onOpenBilling,
  creemProducts,
  enableCreemTopup,
  onCreemProductSelect,
  enableWaffoTopup,
  waffoPayMethods,
  waffoMinTopup,
  onWaffoMethodSelect,
  enableWaffoPancakeTopup,
  selectedPaymentMethod,
  quotaDisplayType = 'USD',
  rawUsdExchangeRate = 1,
  processing = false,
}: RechargeFormCardProps) {
  const { t } = useTranslation()
  const [localAmount, setLocalAmount] = useState(topupAmount.toString())

  const activeMethodType = useMemo(() => {
    return (
      selectedPaymentMethod?.type ||
      (topupInfo?.pay_methods && topupInfo.pay_methods.length > 0
        ? topupInfo.pay_methods[0].type
        : 'epay')
    )
  }, [selectedPaymentMethod, topupInfo])

  const isUsdPayment = useMemo(() => {
    return (
      activeMethodType === 'paypal' ||
      activeMethodType === 'stripe' ||
      activeMethodType === 'waffo_pancake' ||
      activeMethodType === 'waffo' ||
      activeMethodType === 'subotiz'
    )
  }, [activeMethodType])

  const payCurrencySymbol = isUsdPayment ? '$' : '¥'

  const quotaSymbol = useMemo(() => {
    return quotaDisplayType === 'USD' ? '$' : quotaDisplayType === 'CNY' ? '¥' : ''
  }, [quotaDisplayType])

  const payRate = useMemo(() => {
    // 1. If display mode is USD (quota represents USD value)
    if (quotaDisplayType === 'USD') {
      if (isUsdPayment) {
        return 1.0 // 1 USD quota = 1 USD payment amount
      } else {
        return priceRatio // 1 USD quota = priceRatio CNY payment amount (e.g. 7.3 CNY)
      }
    }

    // 2. If display mode is CNY (quota represents CNY value)
    if (quotaDisplayType === 'CNY') {
      if (isUsdPayment) {
        return 1.0 / (rawUsdExchangeRate || 7.3) // 1 CNY quota = 1/7.3 USD payment amount
      } else {
        return 1.0 // 1 CNY quota = 1 CNY payment amount
      }
    }

    // 3. Fallback/Custom Currency Mode
    if (isUsdPayment) {
      return priceRatio / (rawUsdExchangeRate || 1)
    } else {
      return priceRatio
    }
  }, [quotaDisplayType, isUsdPayment, priceRatio, rawUsdExchangeRate])

  useEffect(() => {
    setLocalAmount(topupAmount.toString())
  }, [topupAmount])

  const handleAmountChange = (value: string) => {
    setLocalAmount(value)
    const numValue = parseInt(value) || 0
    if (numValue >= 0) {
      onTopupAmountChange(numValue)
    }
  }

  const hasConfigurableTopup =
    topupInfo?.enable_online_topup ||
    topupInfo?.enable_stripe_topup ||
    topupInfo?.enable_paypal_topup ||
    enableWaffoTopup ||
    enableWaffoPancakeTopup
  const hasAnyTopup = hasConfigurableTopup || enableCreemTopup
  const hasStandardPaymentMethods =
    Array.isArray(topupInfo?.pay_methods) && topupInfo.pay_methods.length > 0
  const hasWaffoPaymentMethods =
    Array.isArray(waffoPayMethods) && waffoPayMethods.length > 0
  const minTopup = getMinTopupAmount(topupInfo)
  const redemptionEnabled = !!topupInfo?.enable_redemption

  if (loading) {
    return (
      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='mt-2 h-4 w-48' />
        </CardHeader>
        <CardContent className='space-y-4 p-3 sm:space-y-6 sm:p-5'>
          <div className='space-y-4 sm:space-y-6'>
            {/* Preset Amounts Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-16' />
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className='h-[72px] rounded-lg' />
                ))}
              </div>
            </div>

            {/* Custom Amount Input Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='h-[42px] w-full' />
            </div>

            {/* Payment Methods Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-32' />
              <div className='flex flex-wrap gap-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className='h-10 w-24 rounded-lg' />
                ))}
              </div>
            </div>
          </div>

          {/* Redemption Code Section Skeleton */}
          <div className='space-y-3 border-t pt-8'>
            <Skeleton className='h-3 w-24' />
            <div className='flex gap-2'>
              <Skeleton className='h-10 flex-1' />
              <Skeleton className='h-10 w-20' />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TitledCard
      title={t('Add Funds')}
      description={t('Choose an amount and payment method')}
      icon={<WalletCards className='h-4 w-4' />}
      action={
        onOpenBilling ? (
          <Button
            variant='outline'
            size='sm'
            onClick={onOpenBilling}
            className='w-full gap-2 sm:w-auto'
          >
            <Receipt className='h-4 w-4' />
            {t('Order History')}
          </Button>
        ) : null
      }
      contentClassName='space-y-4 sm:space-y-6'
    >
      {/* 15-Minute Flash Sale Countdown Banner Bar */}
      <FlashSaleCountdownBanner />

      {/* Online Topup Section */}
      {hasAnyTopup ? (
        <div className='space-y-4 sm:space-y-6'>
          {hasConfigurableTopup && (
            <>
              {presetAmounts.length > 0 && (
                <div className='space-y-2.5 sm:space-y-3'>
                  <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                    {t('Amount')}
                  </Label>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5'>
                    {presetAmounts.map((preset, index) => {
                      const discount =
                        preset.discount ||
                        topupInfo?.discount?.[preset.value] ||
                        1.0
                      const displayValue = preset.value * usdExchangeRate
                      const originalPrice = preset.value * payRate
                      const actualPrice = originalPrice * discount
                      const savedAmount = originalPrice - actualPrice
                      const hasDiscount = discount < 1.0
                      const tierTag = getTierMeta(preset.value, t)
                      const isSelected = selectedPreset === preset.value
                      const isPopular = preset.value === 29
                      const isFlagship = preset.value === 899
                      const mainDisplayAmount = tierTag?.displayAmount || formatNumber(displayValue)

                      return (
                        <Button
                          key={index}
                          variant='outline'
                          className={cn(
                            'relative flex h-auto min-h-[96px] w-full flex-col justify-between items-start rounded-xl p-3 sm:p-3.5 text-left whitespace-normal transition-all duration-200 cursor-pointer shadow-xs',
                            isSelected
                              ? isFlagship
                                ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/40 shadow-sm'
                                : isPopular
                                ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/40 shadow-sm'
                                : 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm'
                              : isPopular
                              ? 'border-rose-500/35 hover:border-rose-500/70 bg-rose-500/[0.03]'
                              : isFlagship
                              ? 'border-purple-500/35 hover:border-purple-500/65 bg-purple-500/[0.03]'
                              : 'border-muted-foreground/20 hover:border-foreground/35 bg-card/60'
                          )}
                          onClick={() => onSelectPreset(preset)}
                        >
                          {/* Top Row: Amount & Badge */}
                          <div className='flex w-full items-center justify-between gap-1'>
                            <div className='text-lg font-extrabold sm:text-xl text-foreground tracking-tight'>
                              {quotaSymbol}{mainDisplayAmount} <span className='text-xs font-semibold text-muted-foreground'>{quotaDisplayType}</span>
                            </div>
                            {tierTag ? (
                              <span
                                className={cn(
                                  'text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap font-bold shrink-0',
                                  tierTag.badgeClass
                                )}
                              >
                                {tierTag.tag}
                              </span>
                            ) : hasDiscount ? (
                              <div className='text-xs font-medium text-green-600'>
                                {getDiscountLabel(discount)}
                              </div>
                            ) : null}
                          </div>

                          {/* Middle Row: Capacity & Never Expire Pill */}
                          <div className='flex w-full items-center justify-between gap-1 text-xs my-1'>
                            <span className='font-semibold text-foreground/90 text-xs sm:text-[13px]'>
                              {tierTag?.tokens}
                            </span>
                            <span className='text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0'>
                              {t('Never Expire')}
                            </span>
                          </div>

                          {/* Bottom Row: You Pay & Value Added */}
                          <div className='text-muted-foreground flex w-full items-center justify-between text-[11px] pt-1.5 border-t border-border/30'>
                            <span>
                              {t('Pay')} <strong className='text-foreground font-bold'>{payCurrencySymbol}{formatCurrency(actualPrice)}</strong>
                            </span>
                            {tierTag?.bonusCredit ? (
                              <span className='text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]'>
                                {tierTag.bonusCredit}
                              </span>
                            ) : hasDiscount && savedAmount > 0 ? (
                              <span className='text-green-600 ml-1'>
                                • {t('Save')} {payCurrencySymbol}{formatCurrency(savedAmount)}
                              </span>
                            ) : null}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className='space-y-2.5 sm:space-y-3'>
                <Label
                  htmlFor='topup-amount'
                  className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
                >
                  {t('Custom Amount')}
                </Label>
                <div className='grid grid-cols-[minmax(0,1fr)_minmax(110px,0.55fr)] gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center'>
                  <div className='relative flex items-center w-full'>
                    {quotaSymbol && (
                      <span className='absolute left-3 text-muted-foreground text-sm pointer-events-none select-none'>
                        {quotaSymbol}
                      </span>
                    )}
                    <Input
                      id='topup-amount'
                      type='number'
                      value={localAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      min={minTopup}
                      placeholder={`Minimum ${minTopup}`}
                      className={cn(
                        'h-9 text-base sm:h-10 sm:text-lg w-full',
                        quotaSymbol ? 'pl-7' : 'pl-3',
                        quotaDisplayType ? 'pr-12' : 'pr-3'
                      )}
                    />
                    {quotaDisplayType && (
                      <span className='absolute right-3 text-muted-foreground text-xs font-semibold pointer-events-none select-none'>
                        {quotaDisplayType}
                      </span>
                    )}
                  </div>
                  <div className='bg-muted/30 flex min-h-9 items-center justify-between gap-2 rounded-md border px-3 lg:min-w-52'>
                    <span className='text-muted-foreground truncate text-xs'>
                      {t('Amount to pay:')}
                    </span>
                    {calculating ? (
                      <Skeleton className='h-5 w-16' />
                    ) : (
                      <span className='text-sm font-semibold'>
                        {payCurrencySymbol}{formatCurrency(paymentAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dynamic Multi-Currency Reference Hint */}
                <div className='flex items-center justify-between flex-wrap gap-1 text-[11px] text-muted-foreground/85 px-0.5 pt-1'>
                  <span className='flex items-center gap-1 flex-wrap'>
                    <span>🌐 {t('Currency Reference:')}</span>
                    <span className='font-mono font-medium text-foreground/90'>
                      ≈ €{(paymentAmount * 0.92).toFixed(2)} EUR · £{(paymentAmount * 0.78).toFixed(2)} GBP · ¥{(paymentAmount * 7.30).toFixed(2)} CNY
                    </span>
                  </span>
                  <span className='text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-0.5'>
                    <span>✓</span>
                    <span>{t('0% Hidden Surcharges')}</span>
                  </span>
                </div>

                <div className='text-xs text-muted-foreground flex items-center gap-2 mt-1 sm:mt-1.5 bg-primary/5 p-2.5 rounded-xl border border-primary/10 transition-all'>
                  <span className='shrink-0 text-base'>💡</span>
                  <span className='font-medium text-foreground/90'>
                    {(() => {
                      const currentVal = Number(localAmount) || topupAmount
                      switch (currentVal) {
                        case 2:
                          return t(
                            '[Starter Pack]: $3.00 Credits (≈ 1.5M Tokens · Never Expire · Incl. +50% Bonus) · Pay only $1.99'
                          )
                        case 5:
                          return t(
                            '[Quick Test Pack]: $7.50 Credits (≈ 3M Tokens · Never Expire · Incl. +50% Bonus) · Fast latency & model test'
                          )
                        case 29:
                          return t(
                            '[Developer Starter Pack · POPULAR]: $43.50 Credits (≈ 40M Tokens · Never Expire · Incl. +50% Bonus) · 56% OFF unit cost, universal for GLM, DeepSeek, Qwen, Kimi & MiniMax'
                          )
                        case 99:
                          return t(
                            '[Team Pro Growth]: $148.50 Credits (≈ 200M Tokens · Never Expire · Incl. +50% Bonus) · 69% OFF unit cost, 30 QPS team pool'
                          )
                        case 299:
                          return t(
                            '[Scale Production]: $299 Credits (≈ 850M Tokens · Never Expire) · Wholesale $0.35/1M (79% OFF), 60 QPS dedicated team pipeline'
                          )
                        case 899:
                          return t(
                            '[Enterprise Flagship]: $899 Credits (≈ 2.5B Tokens · Never Expire) · Guaranteed Lowest $0.35/1M, 100 QPS dedicated edge SLA & Invoices'
                          )
                        default: {
                          const estimatedTokens = (currentVal * 1.38).toFixed(1)
                          return t(
                            'Custom Amount: {{symbol}}{{val}} · Estimated ≈ {{tokens}}M Tokens credit allocation (Incl. +50% Bonus · Never Expire)',
                            { symbol: payCurrencySymbol, val: currentVal, tokens: estimatedTokens }
                          )
                        }
                      }
                    })()}
                  </span>
                </div>
              </div>

              {/* Global Multi-Currency & Fair Exchange Rate Guarantee Banner */}
              <div className='rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-500/[0.06] via-indigo-500/[0.04] to-purple-500/[0.06] p-3 sm:p-3.5 text-xs text-muted-foreground space-y-1.5 shadow-xs'>
                <div className='flex items-center justify-between flex-wrap gap-2 font-semibold text-foreground text-xs sm:text-[13px]'>
                  <div className='flex items-center gap-1.5 text-blue-600 dark:text-blue-400'>
                    <span className='text-sm'>🌐</span>
                    <span>{t('Global Multi-Currency & 0-Fee Settlement Guarantee')}</span>
                  </div>
                  <span className='text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20'>
                    {t('USD Standard Settlement')}
                  </span>
                </div>
                <p className='text-[11px] sm:text-xs leading-relaxed text-muted-foreground'>
                  {t(
                    'All balances and compute quotas are anchored to USD ($1.00 Quota = $1.00 USD). Non-USD international cards (EUR, GBP, CAD, AUD, JPY, CNY, etc.) or PayPal accounts are seamlessly converted by your issuing bank at real-time official interbank exchange rates with zero hidden platform surcharges.'
                  )}
                </p>
              </div>

              <div className='space-y-3 sm:space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label className='text-muted-foreground text-xs font-bold tracking-wider uppercase flex items-center gap-1.5'>
                    <span>{t('Payment Method')}</span>
                  </Label>
                  <span className='text-[11px] text-muted-foreground font-medium flex items-center gap-1'>
                    <ShieldCheck className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                    <span>{t('256-Bit SSL Encrypted Instant Checkout')}</span>
                  </span>
                </div>

                {hasStandardPaymentMethods ? (
                  (() => {
                    const allMethods = topupInfo?.pay_methods || []
                    const paypalMethod = allMethods.find((m) => m.type === 'paypal')
                    const secondaryMethods = allMethods.filter((m) => m.type !== 'paypal')

                    const renderCard = (method: PaymentMethod, isFeatured = false) => {
                      const minTopup = method.min_topup || 0
                      const disabled = minTopup > topupAmount
                      const isPayPal = method.type === 'paypal'
                      const isWaffoPancake = method.type === 'waffo_pancake' || method.type === 'waffo'
                      const isSubotiz = method.type === 'subotiz'
                      const isSelected = selectedPaymentMethod?.type === method.type
                      const isLoading = paymentLoading === method.type

                      let cardTheme = 'border-border/60 bg-muted/20 hover:bg-muted/35 text-foreground'
                      if (isPayPal) {
                        cardTheme = isSelected
                          ? 'border-[#0070ba] bg-[#0070ba]/15 shadow-lg shadow-[#0070ba]/15 ring-2 ring-[#0070ba]'
                          : 'border-blue-500/40 bg-blue-500/5 hover:border-blue-500/70 hover:bg-blue-500/10'
                      } else if (isWaffoPancake) {
                        cardTheme = isSelected
                          ? 'border-indigo-500 bg-indigo-500/15 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                          : 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60 hover:bg-indigo-500/10'
                      } else if (isSubotiz) {
                        cardTheme = isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10'
                      } else if (isSelected) {
                        cardTheme = 'border-primary bg-primary/10 ring-1 ring-primary'
                      }

                      const cardContent = (
                        <div
                          key={method.type}
                          onClick={() => {
                            if (!disabled && !paymentLoading && !calculating && !processing) {
                              onPaymentMethodSelect(method)
                            }
                          }}
                          className={cn(
                            'group relative flex flex-col justify-between rounded-xl border text-left transition-all duration-200 cursor-pointer select-none',
                            isFeatured ? 'p-4 sm:p-5 rounded-2xl w-full' : 'p-3.5 sm:p-4',
                            cardTheme,
                            disabled && 'opacity-50 cursor-not-allowed grayscale'
                          )}
                        >
                          {/* Top Badge */}
                          {isPayPal && (
                            <div className='absolute top-3 right-3 flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs'>
                              <span>★ {t('Recommended • Instant Checkout')}</span>
                            </div>
                          )}
                          {isWaffoPancake && (
                            <div className='absolute top-3 right-3 flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400'>
                              <span>Visa / MC / Alipay</span>
                            </div>
                          )}
                          {isSubotiz && (
                            <div className='absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400'>
                              <span>Apple Pay / G Pay</span>
                            </div>
                          )}

                          {/* Brand Info */}
                          <div className='flex items-start gap-3.5'>
                            <div
                              className={cn(
                                'shrink-0 flex items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                                isFeatured ? 'size-11 sm:size-12' : 'size-10',
                                isPayPal
                                  ? 'bg-[#003087]/15 text-[#0070ba] dark:text-[#0079c1] border border-blue-500/30'
                                  : isWaffoPancake
                                    ? 'bg-indigo-600/15 text-indigo-500 border border-indigo-500/25'
                                    : isSubotiz
                                      ? 'bg-emerald-600/15 text-emerald-500 border border-emerald-500/25'
                                      : 'bg-muted border'
                              )}
                            >
                              {isLoading ? (
                                <Loader2 className={isFeatured ? 'size-6 animate-spin' : 'size-5 animate-spin'} />
                              ) : isPayPal ? (
                                <SiPaypal className={isFeatured ? 'size-6 sm:size-7 text-[#0070ba] dark:text-[#0079c1]' : 'size-5 text-[#0070ba] dark:text-[#0079c1]'} />
                              ) : isWaffoPancake ? (
                                <CreditCard className='size-5 text-indigo-500' />
                              ) : (
                                getPaymentIcon(method.type, 'size-5', method.icon, method.name)
                              )}
                            </div>

                            <div className='space-y-1 min-w-0 pr-24'>
                              <div className='flex items-center gap-1.5'>
                                <h4 className={cn('font-bold text-foreground leading-tight', isFeatured ? 'text-base sm:text-lg' : 'text-sm')}>
                                  {isPayPal
                                    ? t('PayPal Instant Checkout')
                                    : isWaffoPancake
                                      ? t('Credit Card & Alipay')
                                      : isSubotiz
                                        ? t('Cards & Apple/Google Pay')
                                        : method.name}
                                </h4>
                              </div>
                              <p className={cn('text-muted-foreground leading-snug', isFeatured ? 'text-xs sm:text-[13px]' : 'text-[11px] line-clamp-2')}>
                                {isPayPal
                                  ? t('Supports Visa, MasterCard, Amex & PayPal Balance. No PayPal account required for card checkout.')
                                  : isWaffoPancake
                                    ? t('Supports Visa, Mastercard, Apple Pay and Alipay scan checkout.')
                                    : isSubotiz
                                      ? t('Supports Visa, Mastercard, Amex, JCB, UnionPay, Apple Pay & Google Pay.')
                                      : t('Instant Account Credit Activation')}
                              </p>
                            </div>
                          </div>

                          {/* Bottom Features Strip */}
                          <div className={cn('flex items-center justify-between border-t border-border/20 text-muted-foreground', isFeatured ? 'mt-4 pt-3 text-xs' : 'mt-3 pt-2.5 text-[10px]')}>
                            <div className='flex items-center gap-2 flex-wrap'>
                              {isPayPal ? (
                                <>
                                  <span className='flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium'>
                                    <ShieldCheck className='size-3.5' />
                                    {t('Buyer Protection')}
                                  </span>
                                  <span>•</span>
                                  <span className='font-medium text-foreground/80'>{t('Direct Card Checkout (No Account Needed)')}</span>
                                  <span>•</span>
                                  <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
                                    <Zap className='size-3.5' />
                                    {t('0s Instant Credit')}
                                  </span>
                                </>
                              ) : isWaffoPancake ? (
                                <>
                                  <span className='flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium'>
                                    <Lock className='size-3' />
                                    {t('3D Secure Protection')}
                                  </span>
                                  <span>•</span>
                                  <span>{t('Alipay Supported')}</span>
                                  <span>•</span>
                                  <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
                                    <Zap className='size-3' />
                                    {t('Instant Credit')}
                                  </span>
                                </>
                              ) : isSubotiz ? (
                                <>
                                  <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
                                    <ShieldCheck className='size-3' />
                                    {t('Stripe Powered')}
                                  </span>
                                  <span>•</span>
                                  <span>{t('JCB / Amex / UnionPay')}</span>
                                  <span>•</span>
                                  <span className='flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium'>
                                    <Zap className='size-3' />
                                    {t('Instant Credit')}
                                  </span>
                                </>
                              ) : (
                                <span>{t('Instant Credit')}</span>
                              )}
                            </div>

                            <span className={cn(
                              'font-bold flex items-center gap-1 transition-all',
                              isFeatured
                                ? 'text-xs sm:text-sm px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                : cn('text-xs', isSelected ? 'text-primary' : 'text-muted-foreground')
                            )}>
                              {isLoading
                                ? t('Connecting...')
                                : isPayPal
                                  ? t('Pay with PayPal →')
                                  : t('Pay Now →')}
                            </span>
                          </div>
                          {!isPayPal && (
                            <div className='mt-1.5 pt-1.5 border-t border-border/30 flex items-center gap-1 text-[10.5px] text-muted-foreground/80 leading-tight'>
                              <span className='text-amber-500 shrink-0'>💡</span>
                              <span>If your issuing bank declines the card, PayPal above provides smooth direct checkout.</span>
                            </div>
                          )}
                        </div>
                      )

                      return disabled ? (
                        <TooltipProvider key={method.type}>
                          <Tooltip>
                            <TooltipTrigger render={cardContent}></TooltipTrigger>
                            <TooltipContent>
                              {t('Minimum topup amount: {{amount}}', {
                                amount: minTopup,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        cardContent
                      )
                    }

                    return (
                      <div className='space-y-2.5 sm:space-y-3'>
                        {/* 1. Featured Primary Card: PayPal */}
                        {paypalMethod && renderCard(paypalMethod, true)}

                        {/* 2. Secondary Methods Grid */}
                        {secondaryMethods.length > 0 && (
                          <div className='grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2'>
                            {secondaryMethods.map((method) => renderCard(method, false))}
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : hasWaffoPaymentMethods ? null : (
                  <Alert>
                    <AlertDescription>
                      {t('No payment methods available. Please contact administrator.')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alipay Contextual Notice */}
                {(enableWaffoPancakeTopup || topupInfo?.enable_waffo_pancake_topup) && (
                  <div className='flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200'>
                    <span className='shrink-0 text-sm'>💡</span>
                    <span>
                      {t(
                        'Alipay Notice: Select "Credit Card & Alipay", then choose "China / 中国" in the checkout country dropdown to pay via Alipay scan.'
                      )}
                    </span>
                  </div>
                )}

                <PayPalTrustBadges />
              </div>



              {enableWaffoTopup &&
                hasWaffoPaymentMethods &&
                onWaffoMethodSelect && (
                  <div className='space-y-2.5 sm:space-y-3'>
                    <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                      {t('Waffo Payment')}
                    </Label>
                    <div className='grid grid-cols-2 gap-1.5 sm:gap-3 lg:grid-cols-3'>
                      {waffoPayMethods?.map((method, index) => {
                        const loadingKey = `waffo-${index}`
                        const waffoMin = waffoMinTopup || 0
                        const belowMin = waffoMin > topupAmount

                        const button = (
                          <Button
                            key={`${method.name}-${index}`}
                            variant='outline'
                            onClick={() => onWaffoMethodSelect(method, index)}
                            disabled={belowMin || !!paymentLoading}
                            className='h-9 min-w-0 justify-start gap-2 rounded-lg px-3'
                          >
                            {paymentLoading === loadingKey ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : method.icon ? (
                              <img
                                src={method.icon}
                                alt={method.name}
                                className='h-4 w-4 object-contain'
                              />
                            ) : (
                              getPaymentIcon('waffo')
                            )}
                            <span className='truncate'>{method.name}</span>
                          </Button>
                        )

                        return belowMin ? (
                          <TooltipProvider key={`${method.name}-${index}`}>
                            <Tooltip>
                              <TooltipTrigger render={button}></TooltipTrigger>
                              <TooltipContent>
                                {t('Minimum topup amount: {{amount}}', {
                                  amount: waffoMin,
                                })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          button
                        )
                      })}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            {t(
              'Online checkout is being configured. For billing support or account credit questions, contact support@apivel.com.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Creem Products Section */}
      {enableCreemTopup &&
        Array.isArray(creemProducts) &&
        creemProducts.length > 0 &&
        onCreemProductSelect && (
          <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
            <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
              {t('Creem Payment')}
            </Label>
            <CreemProductsSection
              products={creemProducts}
              onProductSelect={(product) => {
                onCreemProductSelect(product)
              }}
            />
          </div>
        )}

      {/* Redemption Code Section */}
      {redemptionEnabled ? (
        <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
          <div className='flex items-center gap-2'>
            <Gift className='text-muted-foreground h-4 w-4' />
            <Label
              htmlFor='redemption-code'
              className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
            >
              {t('Have a Code?')}
            </Label>
          </div>
          <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
            <Input
              id='redemption-code'
              value={redemptionCode}
              onChange={(e) => onRedemptionCodeChange(e.target.value)}
              placeholder={t('Enter your redemption code')}
              className='h-9 min-w-0'
            />
            <Button
              onClick={onRedeem}
              disabled={redeeming}
              variant='outline'
              className='h-9 px-4'
            >
              {redeeming && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {t('Redeem')}
            </Button>
          </div>
          <div className='text-xs text-primary font-medium flex items-center gap-1.5 mt-1 bg-primary/10 p-2 rounded-md border border-primary/20'>
            <span className='shrink-0'>🏷️</span>
            <span>
              {t('Promo Special: Use code BLOG2026 on your $1+ top-up for an extra +$0.20 bonus (+300,000 free Tokens / ~100 completions)!')}
            </span>
          </div>
          {topupLink && (
            <p className='text-muted-foreground text-xs'>
              {t('Need a redemption code?')}{' '}
              <a
                href={topupLink}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 underline-offset-4 hover:underline'
              >
                {t('Get one here')}
                <ExternalLink className='h-3 w-3' />
              </a>
            </p>
          )}
        </div>
      ) : (
        <Alert className='border-t'>
          <AlertDescription>
            {t(
              'Promo code redemption is currently unavailable. Stay tuned for upcoming promotional events!'
            )}
          </AlertDescription>
        </Alert>
      )}
    </TitledCard>
  )
}

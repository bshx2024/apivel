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
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { track } from '@/lib/tracker'
import { getSelf } from '@/lib/api'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { SectionPageLayout } from '@/components/layout'
import { AffiliateRewardsCard } from './components/affiliate-rewards-card'
import { BillingHistoryDialog } from './components/dialogs/billing-history-dialog'
import { CreemConfirmDialog } from './components/dialogs/creem-confirm-dialog'
import { PaymentConfirmDialog } from './components/dialogs/payment-confirm-dialog'
import { PaymentRecoveryDialog } from './components/dialogs/payment-recovery-dialog'
import { TransferDialog } from './components/dialogs/transfer-dialog'
import { RechargeFormCard } from './components/recharge-form-card'
// import { SubscriptionPlansCard } from './components/subscription-plans-card'
import { WalletStatsCard } from './components/wallet-stats-card'
import { DEFAULT_DISCOUNT_RATE } from './constants'
import { SiPaypal } from 'react-icons/si'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  MessageSquare,
  Key,
  ShieldCheck,
  Zap,
  RefreshCw,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react'
import { getApiKeys, fetchTokenKey } from '@/features/keys/api'
import {
  useTopupInfo,
  usePayment,
  useAffiliate,
  useRedemption,
  useCreemPayment,
  useWaffoPayment,
  useWaffoPancakePayment,
} from './hooks'
import {
  getDefaultPaymentType,
  getMinTopupAmount,
  isWaffoPancakePayment,
  isStripePayment,
  isPayPalPayment,
  isSubotizPayment,
} from './lib'
import type {
  UserWalletData,
  PaymentMethod,
  PresetAmount,
  CreemProduct,
} from './types'

interface WalletProps {
  initialShowHistory?: boolean
  initialAmount?: number
  autoPay?: boolean
}

export function Wallet(props: WalletProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>()
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [billingDialogOpen, setBillingDialogOpen] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState('')
  const [creemDialogOpen, setCreemDialogOpen] = useState(false)
  const [selectedCreemProduct, setSelectedCreemProduct] =
    useState<CreemProduct | null>(null)
  const [showSubscriptionPanel] = useState(false)
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false)
  const [failedPaymentMethod, setFailedPaymentMethod] = useState<string>('')
  const [recoveryBannerVisible, setRecoveryBannerVisible] = useState(false)

  const { status } = useStatus()
  const { currency } = useSystemConfig()
  const { topupInfo, presetAmounts, loading: topupLoading } = useTopupInfo()

  // Calculate effective exchange rate - when display type is USD, use rate of 1
  const effectiveUsdExchangeRate = useMemo(() => {
    return currency?.quotaDisplayType === 'USD'
      ? 1
      : currency?.usdExchangeRate || 1
  }, [currency?.quotaDisplayType, currency?.usdExchangeRate])
  const {
    amount: paymentAmount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
  } = usePayment()
  const {
    affiliateLink,
    loading: affiliateLoading,
    transferQuota,
    transferring,
  } = useAffiliate()
  const { redeeming, redeemCode } = useRedemption()
  const { processing: creemProcessing, processCreemPayment } = useCreemPayment()
  const { processWaffoPayment } = useWaffoPayment()
  const { processing: pancakeProcessing, processWaffoPancakePayment } =
    useWaffoPancakePayment()

  // Fetch and refresh user data
  const fetchUser = useCallback(async () => {
    try {
      setUserLoading(true)
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
    track('view_topup')
  }, [fetchUser])

  useEffect(() => {
    if (props.initialShowHistory) {
      setBillingDialogOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Check if user was redirected back with payment failure or cancellation
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = (
      params.get('payment_status') ||
      params.get('status') ||
      ''
    ).toLowerCase()
    const hasError =
      params.get('error') || params.get('failed') || params.get('canceled')
    if (
      paymentStatus === 'failed' ||
      paymentStatus === 'cancelled' ||
      paymentStatus === 'canceled' ||
      hasError
    ) {
      setRecoveryDialogOpen(true)
      setRecoveryBannerVisible(true)
      setFailedPaymentMethod('Bank Card / Gateway')
      track('checkout_abandon_or_fail', { status: paymentStatus, error: hasError })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [props.initialShowHistory])

  // Initialize topup amount when topup info is loaded
  useEffect(() => {
    if (topupInfo && topupAmount === 0) {
      const minTopup = getMinTopupAmount(topupInfo)
      // Default to 29 (Developer Starter Pack) if present in presets, else minTopup
      const defaultPreferred =
        presetAmounts.find((p) => p.value === 29)?.value ||
        presetAmounts[0]?.value ||
        minTopup
      const targetAmount =
        props.initialAmount && props.initialAmount >= minTopup
          ? props.initialAmount
          : defaultPreferred

      setTopupAmount(targetAmount)

      // Match preset if available
      const matchingPreset = presetAmounts.find(
        (p) => p.value === targetAmount
      )
      if (matchingPreset) {
        setSelectedPreset(matchingPreset.value)
      }

      // Calculate initial payment amount with default payment type
      const defaultPaymentType = getDefaultPaymentType(topupInfo)
      calculatePaymentAmount(targetAmount, defaultPaymentType)
    }
  }, [
    topupInfo,
    topupAmount,
    props.initialAmount,
    presetAmounts,
    calculatePaymentAmount,
  ])

  // Get current payment type (selected or default)
  const getCurrentPaymentType = useCallback(() => {
    return selectedPaymentMethod?.type || getDefaultPaymentType(topupInfo)
  }, [selectedPaymentMethod, topupInfo])

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback(
    async (method: PaymentMethod) => {
      setSelectedPaymentMethod(method)
      setPaymentLoading(method.type)

      track('click_payment_channel', {
        method: method.type,
        method_name: method.name,
        amount: topupAmount,
      })

      try {
        // Validate minimum topup
        const minTopup = getMinTopupAmount(topupInfo)
        if (topupAmount < minTopup) {
          toast.error(
            t('Minimum topup amount: {{amount}}', { amount: minTopup })
          )
          return
        }

        // For direct redirect payment methods (PayPal, Stripe, Subotiz, Waffo Pancake), initiate payment immediately on click
        if (
          isPayPalPayment(method.type) ||
          isStripePayment(method.type) ||
          isSubotizPayment(method.type) ||
          isWaffoPancakePayment(method.type)
        ) {
          let success = false
          if (isWaffoPancakePayment(method.type)) {
            success = await processWaffoPancakePayment(topupAmount)
          } else {
            success = await processPayment(topupAmount, method.type)
          }

          // Smart recovery: If non-PayPal payment fails, prompt with recovery dialog
          if (!success && !isPayPalPayment(method.type)) {
            setFailedPaymentMethod(method.name || 'Credit Card')
            setRecoveryDialogOpen(true)
            setRecoveryBannerVisible(true)
          }
          return
        }

        // For other payment methods (e.g. epay form), calculate amount and show confirmation dialog
        await calculatePaymentAmount(topupAmount, method.type)
        setConfirmDialogOpen(true)
      } finally {
        setPaymentLoading(null)
      }
    },
    [topupInfo, topupAmount, t, processPayment, calculatePaymentAmount]
  )

  // Auto trigger payment if autoPay is true
  const [autoPayExecuted, setAutoPayExecuted] = useState(false)
  useEffect(() => {
    if (topupInfo && props.autoPay && topupAmount > 0 && !autoPayExecuted) {
      setAutoPayExecuted(true)
      const timer = setTimeout(() => {
        const defaultType = getDefaultPaymentType(topupInfo)
        const payMethods = topupInfo.pay_methods || []
        const paypalMethod =
          payMethods.find((m) => isPayPalPayment(m.type)) || {
            type: defaultType,
            name: 'PayPal',
          }

        handlePaymentMethodSelect(paypalMethod)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [
    topupInfo,
    props.autoPay,
    topupAmount,
    autoPayExecuted,
    handlePaymentMethodSelect,
  ])

  // Handle preset selection
  const handleSelectPreset = (preset: PresetAmount) => {
    setTopupAmount(preset.value)
    setSelectedPreset(preset.value)
    calculatePaymentAmount(preset.value, getCurrentPaymentType())
    track('select_pay_tier', { amount: preset.value })
  }

  // Handle topup amount change
  const handleTopupAmountChange = (amount: number) => {
    setTopupAmount(amount)
    setSelectedPreset(null)
    calculatePaymentAmount(amount, getCurrentPaymentType())
  }

  // Handle payment confirmation
  const handlePaymentConfirm = async () => {
    if (!selectedPaymentMethod) return

    const isPancake = isWaffoPancakePayment(selectedPaymentMethod.type)
    const success = isPancake
      ? await processWaffoPancakePayment(topupAmount)
      : await processPayment(topupAmount, selectedPaymentMethod.type)

    if (success) {
      setConfirmDialogOpen(false)
      await fetchUser()
    } else if (!isPayPalPayment(selectedPaymentMethod.type)) {
      setConfirmDialogOpen(false)
      setFailedPaymentMethod(selectedPaymentMethod.name || 'Credit Card')
      setRecoveryDialogOpen(true)
      setRecoveryBannerVisible(true)
    }
  }

  const isPayPalAvailable =
    topupInfo?.pay_methods?.some((m) => isPayPalPayment(m.type)) ?? false

  // Handle 1-click smart switch to PayPal or recovery dialog
  const handleSwitchToPayPal = useCallback(async () => {
    const payMethods = topupInfo?.pay_methods || []
    const paypalMethod = payMethods.find((m) => isPayPalPayment(m.type))
    if (!paypalMethod) {
      // PayPal is not configured or under review, open recovery dialog with alternative card guides
      setRecoveryDialogOpen(true)
      return
    }
    setRecoveryDialogOpen(false)
    setRecoveryBannerVisible(false)
    await handlePaymentMethodSelect(paypalMethod)
  }, [topupInfo, handlePaymentMethodSelect])

  // Handle redemption
  const handleRedeem = async () => {
    if (!redemptionCode) return

    const success = await redeemCode(redemptionCode)
    if (success) {
      setRedemptionCode('')
      await fetchUser()
    }
  }

  // Handle transfer
  const handleTransfer = async (amount: number) => {
    const success = await transferQuota(amount)
    if (success) {
      await fetchUser()
    }
    return success
  }

  // Handle Creem product selection
  const handleCreemProductSelect = (product: CreemProduct) => {
    setSelectedCreemProduct(product)
    setCreemDialogOpen(true)
  }

  // Handle Creem payment confirmation
  const handleCreemConfirm = async () => {
    if (!selectedCreemProduct) return

    const success = await processCreemPayment(selectedCreemProduct.productId)
    if (success) {
      setCreemDialogOpen(false)
      setSelectedCreemProduct(null)
      await fetchUser()
    }
  }

  const handleWaffoMethodSelect = async (_method: unknown, index: number) => {
    const loadingKey = `waffo-${index}`
    setPaymentLoading(loadingKey)

    try {
      await processWaffoPayment(topupAmount, index)
    } finally {
      setPaymentLoading(null)
    }
  }

  // Get discount rate for current topup amount
  const getDiscountRate = useCallback(() => {
    return topupInfo?.discount?.[topupAmount] || DEFAULT_DISCOUNT_RATE
  }, [topupInfo, topupAmount])

  const [copiedCursor, setCopiedCursor] = useState(false)
  const handleCopyCursorConfig = async () => {
    try {
      let key = 'YOUR_API_KEY'
      try {
        const res = await getApiKeys({ p: 1, size: 5 })
        const items = res?.data?.items || (Array.isArray(res?.data) ? res.data : [])
        if (items && items.length > 0) {
          const keyData = await fetchTokenKey(items[0].id)
          if (keyData?.data?.key) {
            key = `sk-${keyData.data.key}`
          }
        }
      } catch {
        // fallback
      }
      const baseUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}/v1`
        : 'https://apivel.com/v1'
      const guideText = `# Step 1: Open Cursor Settings -> Models (Cmd+, or Ctrl+,)
# Step 2: Configure OpenAI Key & Base URL
OpenAI API Key: ${key}
Override OpenAI Base URL: ${baseUrl}

# Step 3: Add Custom Models (Click "+ Add model"):
deepseek-v4-flash
qwen3.8-max
glm-5.3-flash`
      await navigator.clipboard.writeText(guideText)
      setCopiedCursor(true)
      toast.success(t('Cursor / OpenAI config copied to clipboard!'))
      setTimeout(() => setCopiedCursor(false), 2500)
    } catch {
      toast.error(t('Failed to copy config'))
    }
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Wallet')}</SectionPageLayout.Title>
        <SectionPageLayout.Description>
          {t('Manage your balance and payment methods')}
        </SectionPageLayout.Description>
        <SectionPageLayout.Content>
          <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5'>
            {/* Free Trial Active Notice for new registered users */}
            {(user?.request_count ?? 0) === 0 && (user?.quota ?? 0) > 0 && (
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-indigo-500/10 to-primary/5 p-4 sm:p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300'>
                <div className='space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className='border-primary/50 bg-primary/20 text-primary text-xs font-bold gap-1'>
                      <Sparkles className='h-3 w-3' />
                      {t('Free Trial Balance Active')}
                    </Badge>
                    <span className='text-xs font-medium text-muted-foreground'>
                      {t('$0.20 USD trial credits pre-loaded')}
                    </span>
                  </div>
                  <h3 className='text-sm sm:text-base font-bold text-foreground'>
                    {t('No deposit required to start testing!')}
                  </h3>
                  <p className='text-xs text-muted-foreground max-w-2xl'>
                    {t("You have 100,000 trial credits ready to use on China's premier frontier models including DeepSeek V4 Flash, Qwen 3.8 Max, and GLM 5.3. Test your connection before adding funds.")}
                  </p>
                </div>
                <div className='flex flex-wrap items-center gap-2 shrink-0 self-stretch sm:self-auto'>
                  <Button
                    size='sm'
                    onClick={() => navigate({ to: '/playground', search: { model: 'deepseek-v4-flash' } })}
                    className='w-full sm:w-auto h-9 font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs cursor-pointer'
                  >
                    <MessageSquare className='h-3.5 w-3.5' />
                    {t('Try in Playground →')}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleCopyCursorConfig}
                    className='w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 cursor-pointer border-primary/30 text-primary hover:bg-primary/10'
                  >
                    {copiedCursor ? <Check className='h-3.5 w-3.5 text-green-500' /> : <Copy className='h-3.5 w-3.5' />}
                    {copiedCursor ? t('Config Copied!') : t('Copy Cursor Config')}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => navigate({ to: '/keys' })}
                    className='w-full sm:w-auto h-9 text-xs font-medium gap-1.5 cursor-pointer'
                  >
                    <Key className='h-3.5 w-3.5' />
                    {t('View API Key')}
                  </Button>
                </div>
              </div>
            )}

            <WalletStatsCard user={user} loading={userLoading} />

            <div
              className={
                showSubscriptionPanel
                  ? 'grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-start'
                  : 'grid gap-4'
              }
            >
              <div id='wallet-add-funds' className='scroll-mt-4 space-y-3'>
                {recoveryBannerVisible && (
                  <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/35 bg-blue-500/10 p-3.5 text-xs text-foreground shadow-xs backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300'>
                    <div className='flex items-center gap-2.5'>
                      <span className='text-base shrink-0'>🛡️</span>
                      <div>
                        <span className='font-bold text-blue-600 dark:text-blue-400'>
                          Payment not completed?
                        </span>
                        <span className='text-muted-foreground ml-1.5 hidden sm:inline'>
                          {isPayPalAvailable
                            ? 'Your bank may have declined the international transaction (no funds were charged). Switch to PayPal for smooth, instant approval.'
                            : 'Your bank may have declined the international transaction (no funds were charged). View alternative payment tips.'}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      <Button
                        size='sm'
                        onClick={handleSwitchToPayPal}
                        className='h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs'
                      >
                        {isPayPalAvailable ? (
                          <>
                            <SiPaypal className='h-3.5 w-3.5' />
                            Pay with PayPal →
                          </>
                        ) : (
                          <>
                            View Solutions →
                          </>
                        )}
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setRecoveryBannerVisible(false)}
                        className='h-8 px-2 text-xs text-muted-foreground hover:text-foreground'
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}

                <RechargeFormCard
                  topupInfo={topupInfo}
                  presetAmounts={presetAmounts}
                  selectedPreset={selectedPreset}
                  onSelectPreset={handleSelectPreset}
                  topupAmount={topupAmount}
                  onTopupAmountChange={handleTopupAmountChange}
                  paymentAmount={paymentAmount}
                  calculating={calculating}
                  onPaymentMethodSelect={handlePaymentMethodSelect}
                  paymentLoading={paymentLoading}
                  redemptionCode={redemptionCode}
                  onRedemptionCodeChange={setRedemptionCode}
                  onRedeem={handleRedeem}
                  redeeming={redeeming}
                  topupLink={topupInfo?.topup_link}
                  loading={topupLoading}
                  priceRatio={(status?.price as number) || 1}
                  usdExchangeRate={effectiveUsdExchangeRate}
                  onOpenBilling={() => setBillingDialogOpen(true)}
                  creemProducts={topupInfo?.creem_products}
                  enableCreemTopup={topupInfo?.enable_creem_topup}
                  onCreemProductSelect={handleCreemProductSelect}
                  enableWaffoTopup={topupInfo?.enable_waffo_topup}
                  waffoPayMethods={topupInfo?.waffo_pay_methods}
                  waffoMinTopup={topupInfo?.waffo_min_topup}
                  onWaffoMethodSelect={handleWaffoMethodSelect}
                  enableWaffoPancakeTopup={
                    topupInfo?.enable_waffo_pancake_topup
                  }
                  selectedPaymentMethod={selectedPaymentMethod}
                  quotaDisplayType={currency?.quotaDisplayType || 'USD'}
                  rawUsdExchangeRate={currency?.usdExchangeRate || 1}
                  processing={processing || pancakeProcessing || creemProcessing}
                />
              </div>

              {/* <SubscriptionPlansCard
                topupInfo={topupInfo}
                onAvailabilityChange={handleSubscriptionAvailabilityChange}
              /> */}
            </div>

            <AffiliateRewardsCard
              user={user}
              affiliateLink={affiliateLink}
              onTransfer={() => setTransferDialogOpen(true)}
              complianceConfirmed={
                topupInfo?.payment_compliance_confirmed !== false
              }
              loading={affiliateLoading}
            />

            {/* Overseas Developer Trust Anchors */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1'>
              <div className='rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-1 shadow-2xs backdrop-blur-xs'>
                <div className='flex items-center gap-2 text-xs font-bold text-foreground'>
                  <ShieldCheck className='h-4 w-4 text-green-500' />
                  <span>{t('Credits Never Expire')}</span>
                </div>
                <p className='text-[11px] text-muted-foreground leading-relaxed'>
                  {t('Your topped-up balance stays valid indefinitely with zero recurring maintenance fees.')}
                </p>
              </div>
              <div className='rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-1 shadow-2xs backdrop-blur-xs'>
                <div className='flex items-center gap-2 text-xs font-bold text-foreground'>
                  <Zap className='h-4 w-4 text-primary' />
                  <span>{t('No China Phone/KYC Required')}</span>
                </div>
                <p className='text-[11px] text-muted-foreground leading-relaxed'>
                  {t('Direct global access to DeepSeek V4, Qwen 3.8 Max, GLM 5.3 & Kimi without domestic verification.')}
                </p>
              </div>
              <div className='rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-1 shadow-2xs backdrop-blur-xs'>
                <div className='flex items-center gap-2 text-xs font-bold text-foreground'>
                  <RefreshCw className='h-4 w-4 text-indigo-500' />
                  <span>{t('99.9% Enterprise Redundancy')}</span>
                </div>
                <p className='text-[11px] text-muted-foreground leading-relaxed'>
                  {t('Multi-cloud upstream failover prevents downtime in Cursor, Claude Code, and IDE plugins.')}
                </p>
              </div>
              <div className='rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-1 shadow-2xs backdrop-blur-xs'>
                <div className='flex items-center gap-2 text-xs font-bold text-foreground'>
                  <CreditCard className='h-4 w-4 text-amber-500' />
                  <span>{t('Global Cards & Gateways')}</span>
                </div>
                <p className='text-[11px] text-muted-foreground leading-relaxed'>
                  {t('Seamless checkout via Visa, Mastercard, UnionPay, or Crypto with instant balance top-up.')}
                </p>
              </div>
            </div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <PaymentConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handlePaymentConfirm}
        topupAmount={topupAmount}
        paymentAmount={paymentAmount}
        paymentMethod={selectedPaymentMethod}
        calculating={calculating}
        processing={processing || pancakeProcessing}
        discountRate={getDiscountRate()}
        usdExchangeRate={effectiveUsdExchangeRate}
      />

      <PaymentRecoveryDialog
        open={recoveryDialogOpen}
        onOpenChange={setRecoveryDialogOpen}
        amount={topupAmount}
        failedMethod={failedPaymentMethod}
        onSwitchToPayPal={handleSwitchToPayPal}
        loading={paymentLoading === 'paypal' || processing}
        paypalEnabled={isPayPalAvailable}
      />

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onConfirm={handleTransfer}
        availableQuota={user?.aff_quota ?? 0}
        transferring={transferring}
      />

      <BillingHistoryDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
      />

      <CreemConfirmDialog
        open={creemDialogOpen}
        onOpenChange={setCreemDialogOpen}
        onConfirm={handleCreemConfirm}
        product={selectedCreemProduct}
        processing={creemProcessing}
      />
    </>
  )
}

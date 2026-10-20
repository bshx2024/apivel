/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Loader2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Gift,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { SiPaypal } from 'react-icons/si'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { useTopupInfo, usePayment, useWaffoPancakePayment } from '@/features/wallet/hooks'
import { getPaymentIcon, isPayPalPayment, isStripePayment, isSubotizPayment, isWaffoPancakePayment } from '@/features/wallet/lib'
import type { PaymentMethod } from '@/features/wallet/types'
import { cn } from '@/lib/utils'

export interface CheckoutTier {
  price: string
  amountNum: number
  credits: string
  bonus?: string
  badgeColor?: string
  estimate?: string
  unitCost?: string
  period?: string
  features?: string[]
  popular?: boolean
  popularLabel?: string
}

interface OneClickCheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tier: CheckoutTier | null
}

export function OneClickCheckoutModal({
  open,
  onOpenChange,
  tier,
}: OneClickCheckoutModalProps) {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const { topupInfo, loading: topupLoading } = useTopupInfo()
  const { processing: standardProcessing, processPayment } = usePayment()
  const { processing: pancakeProcessing, processWaffoPancakePayment } = useWaffoPancakePayment()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const lastClickTimeRef = useRef<number>(0)

  const processing = standardProcessing || pancakeProcessing
  const payMethods = topupInfo?.pay_methods || []

  // Set default payment method when topupInfo loads (prioritize PayPal)
  useEffect(() => {
    if (payMethods.length > 0 && !selectedMethod) {
      const paypal = payMethods.find((m) => isPayPalPayment(m.type))
      const waffo = payMethods.find((m) => isWaffoPancakePayment(m.type) || m.type === 'waffo')
      const stripe = payMethods.find((m) => isStripePayment(m.type))
      const subotiz = payMethods.find((m) => isSubotizPayment(m.type))
      setSelectedMethod(paypal || waffo || stripe || subotiz || payMethods[0])
    }
  }, [payMethods, selectedMethod])

  // Sort methods to place PayPal first
  const displayPayMethods = useMemo(() => {
    return [...payMethods].sort((a, b) => {
      if (isPayPalPayment(a.type)) return -1
      if (isPayPalPayment(b.type)) return 1
      return 0
    })
  }, [payMethods])

  if (!tier) return null

  const handlePay = async () => {
    if (!selectedMethod) {
      toast.error(t('Please select a payment method', '请选择支付方式'))
      return
    }

    const now = Date.now()
    if (now - lastClickTimeRef.current < 2500) {
      toast.info(t('Processing order, please wait...', '正在为您创建订单，请稍候...'))
      return
    }
    lastClickTimeRef.current = now

    // Execute direct checkout
    if (isWaffoPancakePayment(selectedMethod.type)) {
      await processWaffoPancakePayment(tier.amountNum)
    } else {
      await processPayment(tier.amountNum, selectedMethod.type)
    }
  }

  const redirectUrl = `/pricing?checkout_amount=${tier.amountNum}&checkout=true`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg p-0 overflow-hidden border border-blue-500/20 shadow-2xl backdrop-blur-2xl bg-background/95 rounded-2xl'>
        {/* Header Hero */}
        <div className='relative bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-6 text-white overflow-hidden'>
          <div className='absolute -right-6 -top-6 size-36 rounded-full bg-white/10 blur-2xl pointer-events-none' />
          
          <div className='relative z-10 flex items-start justify-between gap-3'>
            <div>
              <div className='inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-200 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-md'>
                <Sparkles className='size-3 text-amber-300' />
                <span>{tier.bonus || 'INSTANT TOP-UP'}</span>
              </div>
              <h3 className='text-2xl font-extrabold mt-2 text-white tracking-tight'>
                {t('Instant Checkout', '一键极速充值')}
              </h3>
              <p className='text-xs text-blue-100/90 mt-1'>
                {t('Pay As You Go credits. Balance never expires.', '按量计费算力包，额度永久有效')}
              </p>
            </div>

            <div className='text-right'>
              <div className='text-3xl font-black text-white tracking-tight'>{tier.price}</div>
              <div className='text-xs font-mono font-bold text-blue-200 mt-0.5'>{tier.credits}</div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className='p-6 space-y-5'>
          <DialogHeader className='sr-only'>
            <DialogTitle>{t('Instant Checkout', '一键极速充值')}</DialogTitle>
            <DialogDescription>{tier.credits}</DialogDescription>
          </DialogHeader>

          {/* Package Value Breakdown */}
          <div className='rounded-xl bg-muted/40 border border-border/40 p-4 space-y-2.5 text-xs'>
            <div className='flex items-center justify-between font-medium'>
              <span className='text-muted-foreground'>{t('Capacity Estimate', '预计可用算力')}</span>
              <span className='font-semibold text-foreground'>{tier.estimate || tier.credits}</span>
            </div>
            {tier.unitCost && (
              <div className='flex items-center justify-between font-medium'>
                <span className='text-muted-foreground'>{t('Effective Unit Cost', '折算单价')}</span>
                <span className='font-mono font-bold text-blue-600 dark:text-blue-400'>{tier.unitCost}</span>
              </div>
            )}
            <div className='flex items-center justify-between font-medium'>
              <span className='text-muted-foreground'>{t('Validity & Billing', '有效期与模式')}</span>
              <span className='inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400'>
                <CheckCircle2 className='size-3.5' /> {tier.period || t('Pay As You Go (Credits Never Expire)', '按量抵扣（额度永不过期）')}
              </span>
            </div>
            <div className='flex items-center justify-between font-medium border-t border-border/30 pt-2'>
              <span className='font-bold text-foreground text-sm'>{t('Total Due Today', '应付金额')}</span>
              <span className='text-lg font-extrabold text-blue-600 dark:text-blue-400'>{tier.price}</span>
            </div>
          </div>

          {/* Unauthenticated Guest Experience vs Logged-in Experience */}
          {!user ? (
            <div className='space-y-4'>
              {/* PayPal / Credit Card Global Instant Checkout Card */}
              <div className='rounded-xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/25 p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-[#0070BA] text-white shadow-md shadow-blue-500/30'>
                      <SiPaypal className='size-4' />
                    </div>
                    <div>
                      <h4 className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                        <span>{t('PayPal & Credit Card Fast Pay', 'PayPal / 国际信用卡安全收银')}</span>
                        <span className='text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold px-1.5 py-0.2 rounded'>
                          {t('Recommended', '优先推荐')}
                        </span>
                      </h4>
                      <p className='text-[11px] text-muted-foreground mt-0.5'>
                        {t('Instant credit activation • Supports PayPal balance, Visa, Mastercard & Apple Pay', '即时充值到账 • 支持 PayPal 余额、Visa、Mastercard 及借记卡')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-2 text-[11px] pt-1 text-muted-foreground'>
                  <div className='flex items-center gap-1.5'>
                    <ShieldCheck className='size-3.5 text-emerald-500 shrink-0' />
                    <span>{t('PCI-DSS 3D Secure Protection', '3D Secure 银行级安全')}</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Gift className='size-3.5 text-amber-500 shrink-0' />
                    <span>{t('New User +$0.20 Free Gift', '新用户注册立赠 $0.20')}</span>
                  </div>
                </div>
              </div>

              {/* Guest CTA Action */}
              <div className='space-y-2 pt-1'>
                <Link
                  to='/sign-up'
                  search={{ redirect: redirectUrl }}
                  onClick={() => onOpenChange(false)}
                  className='flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer'
                >
                  <Gift className='size-4 text-white shrink-0' />
                  <span>{t('Create Free Account & Checkout →', '免费注册并极速结账 →')}</span>
                </Link>

                <p className='text-center text-[11px] text-muted-foreground leading-relaxed'>
                  {t('Free $0.20 trial credits on signup. Google / GitHub one-tap sign in supported.', '注册即得 $0.20 免费额度，支持 Google / GitHub 一键授权')}
                </p>

                <p className='text-center text-[11px] text-muted-foreground'>
                  {t('Already have an account?', '已有账号？')}{' '}
                  <Link
                    to='/sign-in'
                    search={{ redirect: redirectUrl }}
                    onClick={() => onOpenChange(false)}
                    className='font-semibold text-blue-500 hover:underline'
                  >
                    {t('Sign in', '登录')}
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Method Selector (Logged In) */}
              <div className='space-y-2'>
                <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  {t('Select Payment Method', '选择支付方式')}
                </label>

                {topupLoading ? (
                  <div className='flex items-center justify-center p-6 border rounded-xl bg-muted/20'>
                    <Loader2 className='size-5 animate-spin text-muted-foreground' />
                  </div>
                ) : displayPayMethods.length > 0 ? (
                  <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
                    {displayPayMethods.map((method) => {
                      const isSelected = selectedMethod?.type === method.type
                      const isPayPal = isPayPalPayment(method.type)
                      return (
                        <button
                          key={method.type}
                          type='button'
                          onClick={() => setSelectedMethod(method)}
                          disabled={processing}
                          className={cn(
                            'flex items-center justify-between gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer text-xs font-semibold',
                            isSelected
                              ? 'border-blue-500 bg-blue-500/10 text-foreground ring-1 ring-blue-500'
                              : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                          )}
                        >
                          <div className='flex items-center gap-2.5 min-w-0'>
                            {getPaymentIcon(method.type, 'size-4 shrink-0', method.icon, method.name)}
                            <span className='truncate'>{method.name}</span>
                          </div>
                          {isPayPal && (
                            <span className='rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 text-[9px] font-extrabold shrink-0'>
                              {t('Recommended', '推荐')}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className='rounded-xl border border-dashed p-3.5 flex items-center justify-center gap-2 text-xs font-semibold text-foreground bg-muted/10'>
                    <CreditCard className='size-4 text-blue-500' />
                    <span>{t('Credit Card / Global Pay', '信用卡 / 全球安全收银')}</span>
                  </div>
                )}
              </div>

              {/* Pay Button & Trust Security */}
              <div className='space-y-3 pt-2'>
                <Button
                  onClick={handlePay}
                  disabled={processing || topupLoading}
                  className='h-12 w-full text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer'
                >
                  {processing ? (
                    <>
                      <Loader2 className='size-4 animate-spin mr-2' />
                      <span>{t('Connecting to Checkout...', '正在呼起安全收银台...')}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedMethod?.name
                          ? t('Pay {{price}} with {{method}}', {
                              price: tier.price,
                              method: selectedMethod.name,
                              defaultValue: `使用 ${selectedMethod.name} 支付 ${tier.price}`,
                            })
                          : t('Pay {{price}} via Credit Card / Global Pay', {
                              price: tier.price,
                              defaultValue: `使用 信用卡 / 全球支付 ${tier.price}`,
                            })}
                      </span>
                      <ArrowRight className='size-4 ml-1.5' />
                    </>
                  )}
                </Button>

                <div className='flex items-center justify-center gap-3 text-[11px] text-muted-foreground pt-1'>
                  <span className='flex items-center gap-1'>
                    <Lock className='size-3 text-emerald-500' />
                    {t('256-Bit SSL Encrypted', '256位银行级加密')}
                  </span>
                  <span>•</span>
                  <span className='flex items-center gap-1'>
                    <Zap className='size-3 text-blue-500' />
                    {t('Instant Credit Delivery', '支付成功即时到账')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Zap, ShieldAlert, CheckCircle2, ArrowRight, LifeBuoy, Loader2, Sparkles, Copy, Check, MessageSquare, CreditCard } from 'lucide-react'
import { SiPaypal } from 'react-icons/si'
import { Button } from '@/components/ui/button'
import { getApiKeys, fetchTokenKey } from '@/features/keys/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PaymentRecoveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  failedMethod?: string
  onSwitchToPayPal: () => void
  loading?: boolean
  paypalEnabled?: boolean
}

export function PaymentRecoveryDialog({
  open,
  onOpenChange,
  amount,
  failedMethod,
  onSwitchToPayPal,
  loading = false,
  paypalEnabled = false,
}: PaymentRecoveryDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [copiedCursor, setCopiedCursor] = useState(false)
  const [copyingConfig, setCopyingConfig] = useState(false)

  const handleCopyCursorConfig = async () => {
    try {
      setCopyingConfig(true)
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
    } finally {
      setCopyingConfig(false)
    }
  }

  const displayAmount = amount > 0 ? `$${amount.toFixed(2)} USD` : 'your balance'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-sm:w-[calc(100vw-1.5rem)] sm:max-w-lg border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl p-6">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xs">
              <ShieldAlert className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Payment Not Completed? We&apos;re Here to Help
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Your card was not charged. Switch to a seamless checkout route below:
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs sm:text-sm">
          {/* Reason explanation */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5">
            <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <span>🛡️</span> No worries — your card was not charged
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {failedMethod ? `Your transaction via ${failedMethod}` : 'Your transaction'} was declined by your card issuer&apos;s international payment policy. To avoid delays and activate your balance immediately, you can seamlessly complete checkout via PayPal below.
            </p>
          </div>

          {/* Smart fallback route: If PayPal is enabled, suggest PayPal; otherwise suggest Apple Pay / 3D-Secure / International Card guide */}
          {paypalEnabled ? (
            <div className="rounded-xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-indigo-500/10 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                    <SiPaypal className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      Recommended Solution: PayPal Instant Checkout
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.2 text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                        HIGH APPROVAL RATE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-blue-500/20">
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Smooth approval with international cards</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>No PayPal account required (pay with card directly)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Instant 0-delay balance activation</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Full Buyer Protection included</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={onSwitchToPayPal}
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting to PayPal...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-current text-amber-300" />
                    <span>Switch to PayPal & Pay {displayAmount}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-purple-500/10 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      Recommended: High-Approval Card Solutions
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.2 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                        TIP FOR OVERSEAS USERS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-indigo-500/20">
                <div className="flex items-start gap-2 text-foreground/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Use Apple Pay / Google Pay:</strong> Direct biometric verification bypasses strict 3D-Secure issuer rejections.</span>
                </div>
                <div className="flex items-start gap-2 text-foreground/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Enable Cross-Border Payments:</strong> Check your bank mobile app to ensure &quot;International Online Purchases&quot; is toggled ON.</span>
                </div>
                <div className="flex items-start gap-2 text-foreground/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Manual / Business Topup:</strong> Need Alipay / WeChat / Corporate Wire? Email support to credit immediately.</span>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Try Again with Apple Pay / Another Card</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.location.href = 'mailto:support@apivel.com?subject=Manual%20Topup%20Request'
                  }}
                  className="h-10 text-xs font-semibold border-indigo-500/30 gap-1"
                >
                  <LifeBuoy className="h-3.5 w-3.5 mr-1" />
                  Contact Support
                </Button>
              </div>
            </div>
          )}

          {/* Zero-Friction Developer Bypass: Test immediately with free credits */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="font-bold text-xs text-foreground">
                  {t('No need to wait — Free Trial is active!')}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                $0.20 Free
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('You already have complimentary credits pre-loaded. Test completions in Cursor, Python, or Web Playground right away:')}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyCursorConfig}
                disabled={copyingConfig}
                className="h-7 text-xs font-semibold gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 cursor-pointer"
              >
                {copiedCursor ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiedCursor ? t('Config Copied!') : t('Copy Cursor / Python Config')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  navigate({ to: '/playground', search: { model: 'deepseek-v4-flash' } })
                }}
                className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <MessageSquare className="h-3 w-3 text-primary" />
                {t('Test in Playground →')}
              </Button>
            </div>
          </div>

          {/* Alternative support info */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <LifeBuoy className="h-3.5 w-3.5" />
              Need corporate invoicing or manual wire?
            </span>
            <a
              href="mailto:support@apivel.com?subject=VIP%20Billing%20Assistance"
              className="font-medium text-primary hover:underline"
            >
              support@apivel.com
            </a>
          </div>
        </div>

        <DialogFooter className="sm:justify-between border-t border-border/40 pt-3 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
          >
            I&apos;ll choose another method
          </Button>
          <span className="text-[11px] text-muted-foreground/75 self-center hidden sm:inline">
            🔒 256-Bit SSL Encrypted Checkout
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { useEffect, useState, useRef } from 'react'
import { z } from 'zod'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { capturePayPalPayment, isApiSuccess } from '@/features/wallet/api'

const callbackSearchSchema = z.object({
  token: z.string().catch(''),
  PayerID: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/wallet/paypal-callback')({
  component: PayPalCallbackComponent,
  validateSearch: callbackSearchSchema,
})

function PayPalCallbackComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const hasCaptured = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage(t('Invalid payment parameters'))
      return
    }

    if (hasCaptured.current) return
    hasCaptured.current = true

    const doCapture = async () => {
      try {
        const res = await capturePayPalPayment(token)
        if (isApiSuccess(res)) {
          setStatus('success')
          toast.success(t('Payment completed successfully'))
          setTimeout(() => {
            navigate({ to: '/wallet' })
          }, 3000)
        } else {
          setStatus('error')
          setErrorMessage(res.message || t('Payment capture failed'))
        }
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || t('An unexpected error occurred during payment processing'))
      }
    }

    doCapture()
  }, [token, navigate, t])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card/60 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t('PayPal Checkout')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-6 text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse" />
                <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {t('Processing your payment...')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('Please do not close this page or click back')}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 stroke-[1.5]" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">
                  {t('Payment Successful!')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('Thank you! Your balance has been updated.')}
                </p>
                <p className="text-xs text-muted-foreground/75 italic">
                  {t('Redirecting to wallet in 3 seconds...')}
                </p>
              </div>
              <div className="pt-2">
                <Button onClick={() => navigate({ to: '/wallet' })} className="w-full">
                  {t('Back to Wallet')}
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-destructive stroke-[1.5]" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">
                  {t('Payment Interrupted')}
                </p>
                <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-1.5 rounded-md max-w-xs mx-auto">
                  {errorMessage || t('Verification timed out or card authorization failed')}
                </p>
                <p className="text-xs text-muted-foreground pt-1 max-w-xs mx-auto">
                  {t('Your card was not charged. You can retry PayPal with another card or switch to our alternative credit card route.')}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2.5 w-full">
                <div className="flex gap-2.5 w-full">
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: '/wallet', search: { payment_status: 'failed' } as any })}
                    className="flex-1 text-xs"
                  >
                    {t('Try Alternative Route')}
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    {t('Retry PayPal')}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  {t('Need assistance? Email VIP billing support at')} <a href="mailto:support@apivel.com" className="text-primary hover:underline">support@apivel.com</a>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

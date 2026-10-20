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
import { useState, useCallback, useRef } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import {
  calculateAmount,
  calculateStripeAmount,
  calculateWaffoPancakeAmount,
  calculatePayPalAmount,
  calculateSubotizAmount,
  requestPayment,
  requestStripePayment,
  requestPayPalPayment,
  requestSubotizPayment,
  isApiSuccess,
} from '../api'
import {
  isStripePayment,
  isPayPalPayment,
  isSubotizPayment,
  isWaffoPancakePayment,
  submitPaymentForm,
} from '../lib'

// ============================================================================
// Payment Hook
// ============================================================================

export function usePayment() {
  const [amount, setAmount] = useState<number>(0)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const lastProcessTimeRef = useRef<number>(0)

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setCalculating(true)

        const isStripe = isStripePayment(paymentType)
        const isPayPal = isPayPalPayment(paymentType)
        const isPancake = isWaffoPancakePayment(paymentType)
        const isSubotiz = isSubotizPayment(paymentType)
        const response = isStripe
          ? await calculateStripeAmount({ amount: topupAmount })
          : isPayPal
            ? await calculatePayPalAmount({ amount: topupAmount })
            : isPancake
              ? await calculateWaffoPancakeAmount({ amount: topupAmount })
              : isSubotiz
                ? await calculateSubotizAmount({ amount: topupAmount })
                : await calculateAmount({ amount: topupAmount })

        if (isApiSuccess(response) && response.data) {
          const calculatedAmount = parseFloat(response.data)
          setAmount(calculatedAmount)
          return calculatedAmount
        }

        // Don't show error for calculation, just set to 0
        setAmount(0)
        return 0
      } catch (_error) {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  // Process payment
  const processPayment = useCallback(
    async (topupAmount: number, paymentType: string) => {
      const now = Date.now()
      if (now - lastProcessTimeRef.current < 2500) {
        // Prevent rapid double clicking
        toast.info(
          i18next.t(
            'System is processing your request. Please wait a moment without clicking repeatedly.',
            { defaultValue: '正在为您处理支付请求，请稍候...' }
          )
        )
        return false
      }
      lastProcessTimeRef.current = now

      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        const isPayPal = isPayPalPayment(paymentType)
        const isSubotiz = isSubotizPayment(paymentType)
        const amount = Math.floor(topupAmount)

        const response = isStripe
          ? await requestStripePayment({
              amount,
              payment_method: 'stripe',
            })
          : isPayPal
            ? await requestPayPalPayment({
                amount,
                payment_method: 'paypal',
              })
            : isSubotiz
              ? await requestSubotizPayment({
                  amount,
                  payment_method: 'subotiz',
                })
              : await requestPayment({
                  amount,
                  payment_method: paymentType,
                })

        if (!isApiSuccess(response)) {
          toast.error(response.message || i18next.t('Payment request failed'))
          return false
        }

        // Handle Stripe payment
        if (isStripe && (response.data as { pay_link?: string })?.pay_link) {
          window.open((response.data as { pay_link: string }).pay_link, '_blank')
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        // Handle PayPal payment
        if (isPayPal && (response.data as { pay_link?: string })?.pay_link) {
          window.location.href = (response.data as { pay_link: string }).pay_link
          toast.success(i18next.t('Redirecting to PayPal...'))
          return true
        }

        // Handle Subotiz payment
        if (isSubotiz && (response.data as { checkout_url?: string })?.checkout_url) {
          window.location.href = (response.data as { checkout_url: string }).checkout_url
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        // Handle non-Stripe payment
        if (!isStripe && !isPayPal && !isSubotiz && response.data) {
          const url = (response as unknown as { url?: string }).url
          if (url) {
            submitPaymentForm(url, response.data)
            toast.success(i18next.t('Redirecting to payment page...'))
            return true
          }
        }

        return false
      } catch (_error) {
        toast.error(i18next.t('Payment request failed'))
        return false
      } finally {
        setProcessing(false)
      }
    },
    []
  )

  return {
    amount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    setAmount,
  }
}

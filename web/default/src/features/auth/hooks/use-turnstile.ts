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
import { useState, useEffect } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import { useStatus } from '@/hooks/use-status'

/**
 * Hook for managing Turnstile verification with timeout and fallback support
 */
export function useTurnstile(required = false) {
  const { status } = useStatus()
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileFailCount, setTurnstileFailCount] = useState(0)
  const [isTurnstileFallback, setIsTurnstileFallback] = useState(false)

  const isTurnstileEnabled = !!(
    status?.turnstile_check && status?.turnstile_site_key
  )
  const turnstileSiteKey = status?.turnstile_site_key || ''

  useEffect(() => {
    if (!required || !isTurnstileEnabled || turnstileToken) return

    // 5s timeout detection for Turnstile SDK loading issues
    const timer = setTimeout(() => {
      if (!turnstileToken) {
        setTurnstileFailCount((prev) => {
          const next = prev + 1
          if (next >= 2) {
            setIsTurnstileFallback(true)
          }
          return next
        })
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [required, isTurnstileEnabled, turnstileToken])

  /**
   * Validate if turnstile is ready when required
   */
  const validateTurnstile = (): boolean => {
    if (isTurnstileEnabled && required && !turnstileToken && !isTurnstileFallback) {
      toast.info(
        i18next.t('Please wait a moment, human check is initializing...')
      )
      return false
    }
    return true
  }

  return {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
    turnstileFailCount,
    isTurnstileFallback,
    setIsTurnstileFallback,
  }
}

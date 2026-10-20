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

const STORAGE_ANON_ID_KEY = 'apivel_anon_id'

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let anonId = localStorage.getItem(STORAGE_ANON_ID_KEY)
    if (!anonId) {
      anonId = generateUUID()
      localStorage.setItem(STORAGE_ANON_ID_KEY, anonId)
    }
    return anonId
  } catch {
    return ''
  }
}

export interface TrackPayload {
  event_name: string
  anonymous_id?: string
  properties?: Record<string, any>
  page_url?: string
  referrer?: string
  timestamp?: number
}

/**
 * Track user milestone events in a lightweight, non-blocking way
 */
export function track(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined' || !eventName) return

  try {
    const payload: TrackPayload = {
      event_name: eventName,
      anonymous_id: getAnonymousId(),
      properties: properties || {},
      page_url: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || '',
      timestamp: Math.floor(Date.now() / 1000),
    }

    const body = JSON.stringify(payload)

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      const sent = navigator.sendBeacon('/api/track', blob)
      if (sent) return
    }

    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    }).catch(() => {
      // Ignore network errors in tracking
    })
  } catch (e) {
    // Ignore tracker errors
  }
}

/**
 * Report sign-up lead conversion event to Google Ads
 */
export function trackGoogleAdsSignUpConversion(): void {
  if (typeof window === 'undefined') return
  try {
    const win = window as unknown as { gtag?: (...args: any[]) => void }
    if (typeof win.gtag === 'function') {
      win.gtag('event', 'conversion', {
        send_to: 'AW-17908605238/evgiCLDqnvIbELbCvttC',
        value: 1.0,
        currency: 'USD',
      })
    }
  } catch {
    // Ignore tracking errors
  }
}


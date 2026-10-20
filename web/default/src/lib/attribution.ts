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

import { getCookie, setCookie } from '@/lib/cookies'
import { saveAffiliateCode } from '@/features/auth/lib/storage'

export interface TouchAttribution {
  source: string
  medium: string
  campaign: string
  referrer: string
  landing: string
  timestamp: number
}

export interface AttributionPayload {
  first_source?: string
  first_medium?: string
  first_campaign?: string
  first_referrer?: string
  first_landing?: string
  first_touch_at?: number

  last_source?: string
  last_medium?: string
  last_campaign?: string

  register_lang?: string
}

const COOKIE_FT_KEY = 'attr_ft'
const COOKIE_LT_KEY = 'attr_lt'
const STORAGE_FT_KEY = 'attr_first_touch'
const STORAGE_LT_KEY = 'attr_last_touch'

const FT_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
const LT_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Parses current visitor's traffic source from URL and Document Referrer
 */
function parseTrafficSource(): {
  source: string
  medium: string
  campaign: string
  referrer: string
  hasExplicitMarketing: boolean
} {
  if (typeof window === 'undefined') {
    return { source: '', medium: '', campaign: '', referrer: '', hasExplicitMarketing: false }
  }

  const urlParams = new URLSearchParams(window.location.search)

  // 1. Check UTM and custom parameters
  const utmSource = urlParams.get('utm_source')?.trim()
  const utmMedium = urlParams.get('utm_medium')?.trim()
  const utmCampaign = urlParams.get('utm_campaign')?.trim()

  const refParam = urlParams.get('ref')?.trim()
  const fParam = urlParams.get('f')?.trim()
  const channelParam = urlParams.get('channel')?.trim()
  const affParam = urlParams.get('aff')?.trim()

  let source = utmSource || channelParam || refParam || fParam || ''
  let medium = utmMedium || ''
  let campaign = utmCampaign || ''
  let hasExplicitMarketing = false

  if (affParam) {
    saveAffiliateCode(affParam)
    if (!source) {
      source = `aff_${affParam}`
      medium = 'referral'
    }
  }

  if (source || medium || campaign) {
    hasExplicitMarketing = true
    if (!medium) medium = 'campaign'
    return {
      source,
      medium,
      campaign,
      referrer: document.referrer || '',
      hasExplicitMarketing,
    }
  }

  // 2. Check Referrer
  const rawReferrer = document.referrer ? document.referrer.trim() : ''
  if (!rawReferrer) {
    return {
      source: 'direct',
      medium: 'none',
      campaign: '',
      referrer: '',
      hasExplicitMarketing: false,
    }
  }

  try {
    const refUrl = new URL(rawReferrer)
    const currentHost = window.location.hostname

    // Internal referrer - do not treat as new external source
    if (refUrl.hostname === currentHost || refUrl.hostname.endsWith(`.${currentHost}`)) {
      return { source: '', medium: '', campaign: '', referrer: rawReferrer, hasExplicitMarketing: false }
    }

    const host = refUrl.hostname.toLowerCase()

    if (host.includes('google.')) {
      source = 'google'
      medium = 'organic'
    } else if (host.includes('bing.')) {
      source = 'bing'
      medium = 'organic'
    } else if (host.includes('baidu.')) {
      source = 'baidu'
      medium = 'organic'
    } else if (host.includes('duckduckgo.')) {
      source = 'duckduckgo'
      medium = 'organic'
    } else if (host.includes('t.co') || host.includes('twitter.') || host.includes('x.com')) {
      source = 'twitter'
      medium = 'social'
    } else if (host.includes('jike.') || host.includes('ruguoapp.com')) {
      source = 'jike'
      medium = 'social'
    } else if (host.includes('zhihu.')) {
      source = 'zhihu'
      medium = 'social'
    } else if (host.includes('v2ex.')) {
      source = 'v2ex'
      medium = 'community'
    } else if (host.includes('github.')) {
      source = 'github'
      medium = 'social'
    } else if (host.includes('reddit.')) {
      source = 'reddit'
      medium = 'social'
    } else if (host.includes('linux.do')) {
      source = 'linuxdo'
      medium = 'community'
    } else {
      source = refUrl.hostname
      medium = 'referral'
    }

    return {
      source,
      medium,
      campaign: '',
      referrer: rawReferrer,
      hasExplicitMarketing: true,
    }
  } catch {
    return {
      source: 'referral',
      medium: 'referral',
      campaign: '',
      referrer: rawReferrer,
      hasExplicitMarketing: true,
    }
  }
}

/**
 * Initialize attribution tracker on page load
 */
export function initAttributionTracker(): void {
  if (typeof window === 'undefined') return

  try {
    const traffic = parseTrafficSource()
    const now = Math.floor(Date.now() / 1000)
    const landing = `${window.location.pathname}${window.location.search}`

    // 1. First Touch Handling
    const existingFT = getStoredTouch(STORAGE_FT_KEY, COOKIE_FT_KEY)
    if (!existingFT && traffic.source) {
      const ft: TouchAttribution = {
        source: traffic.source,
        medium: traffic.medium,
        campaign: traffic.campaign,
        referrer: traffic.referrer,
        landing,
        timestamp: now,
      }
      saveTouch(STORAGE_FT_KEY, COOKIE_FT_KEY, ft, FT_MAX_AGE)
    }

    // 2. Last Touch Handling
    if (traffic.hasExplicitMarketing && traffic.source) {
      const lt: TouchAttribution = {
        source: traffic.source,
        medium: traffic.medium,
        campaign: traffic.campaign,
        referrer: traffic.referrer,
        landing,
        timestamp: now,
      }
      saveTouch(STORAGE_LT_KEY, COOKIE_LT_KEY, lt, LT_MAX_AGE)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Attribution tracker error:', err)
  }
}

function saveTouch(storageKey: string, cookieKey: string, data: TouchAttribution, maxAge: number): void {
  try {
    const serialized = JSON.stringify(data)
    window.localStorage.setItem(storageKey, serialized)
    setCookie(cookieKey, encodeURIComponent(serialized), maxAge)
  } catch {
    // ignore
  }
}

function getStoredTouch(storageKey: string, cookieKey: string): TouchAttribution | null {
  try {
    const fromStorage = window.localStorage.getItem(storageKey)
    if (fromStorage) {
      return JSON.parse(fromStorage)
    }
    const fromCookie = getCookie(cookieKey)
    if (fromCookie) {
      return JSON.parse(decodeURIComponent(fromCookie))
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Returns attribution payload for registration
 */
export function getAttributionPayload(): AttributionPayload {
  if (typeof window === 'undefined') return {}

  const ft = getStoredTouch(STORAGE_FT_KEY, COOKIE_FT_KEY)
  const lt = getStoredTouch(STORAGE_LT_KEY, COOKIE_LT_KEY) || ft

  const payload: AttributionPayload = {}

  if (ft) {
    payload.first_source = ft.source
    payload.first_medium = ft.medium
    payload.first_campaign = ft.campaign
    payload.first_referrer = ft.referrer
    payload.first_landing = ft.landing
    payload.first_touch_at = ft.timestamp
  }

  if (lt) {
    payload.last_source = lt.source
    payload.last_medium = lt.medium
    payload.last_campaign = lt.campaign
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    payload.register_lang = navigator.language
  }

  return payload
}

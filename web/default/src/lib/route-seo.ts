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
import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'

const CANONICAL_ORIGIN = 'https://apivel.com'
const DEFAULT_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex, nofollow'

interface RouteSeoMeta {
  title: string
  description: string
}

const CANONICAL_PATH_ALIASES: Record<string, string> = {
  '/login': '/sign-in',
  '/register': '/sign-up',
  '/privacy-policy': '/privacy',
  '/user-agreement': '/terms',
}

const NOINDEX_PREFIXES = [
  '/forgot-password',
  '/reset',
  '/user/reset',
  '/otp',
  '/oauth',
  '/setup',
  '/console',
  '/dashboard',
  '/playground',
  '/wallet',
  '/keys',
  '/usage-logs',
  '/profile',
  '/channels',
  '/users',
  '/system-settings',
  '/subscriptions',
  '/redemption-codes',
  '/chat',
  '/chat2link',
  '/models',
]

const STATIC_ROUTE_META: Record<string, RouteSeoMeta> = {
  '/': {
    title: 'DeepSeek API Pricing: PayPal & OpenAI Gateway | APIVEL',
    description:
      'Compare DeepSeek API pricing & token rates. Zero 503 overload errors, no +86 phone needed, instant PayPal billing, and 100% OpenAI-compatible endpoint.',
  },
  '/pricing': {
    title:
      'Plans & Model Pricing Directory (DeepSeek, Qwen, GLM, Kimi) | APIVEL',
    description:
      'Compare live per-million token pricing, developer credit packs, and PayPal pay-as-you-go tiers for DeepSeek V4.1 Flash, Qwen 3.8, GLM-5.3, and Kimi K3 on APIVEL.',
  },
  '/about': {
    title: 'About APIVEL | High-Availability Chinese AI API Gateway',
    description:
      "Learn about APIVEL's multi-cluster failover architecture, transparent per-token pricing, and OpenAI-compatible gateway for DeepSeek, Qwen, GLM, and Kimi.",
  },
  '/docs': {
    title: 'Developer Documentation | APIVEL',
    description:
      'Quickstart guides, OpenAI SDK integration, authentication, and model endpoint documentation for the APIVEL API gateway.',
  },
  '/rankings': {
    title: 'AI Model Usage & Performance Rankings | APIVEL',
    description:
      'Explore real-time model usage trends and developer rankings across DeepSeek, Qwen, GLM, and Kimi on APIVEL.',
  },
  '/sign-in': {
    title: 'Sign In | APIVEL',
    description:
      'Sign in to your APIVEL developer console to manage API keys, usage logs, and pay-as-you-go credits.',
  },
  '/sign-up': {
    title: 'Create an Account — $0.20 Free Credit | APIVEL',
    description:
      'Register an APIVEL developer account with zero KYC and get $0.20 free API credit for DeepSeek, Qwen, GLM, and Kimi.',
  },
  '/privacy': {
    title: 'Privacy Policy | APIVEL',
    description:
      'Read the APIVEL Privacy Policy covering account information, billing records, API telemetry, and data protection.',
  },
  '/terms': {
    title: 'Terms of Service | APIVEL',
    description:
      'Read the APIVEL Terms of Service governing platform access, API usage, billing, and acceptable use.',
  },
  '/refund': {
    title: 'Refund Policy | APIVEL',
    description:
      "Review APIVEL's refund policy and eligibility terms for prepaid API credits and developer packs.",
  },
  '/contact': {
    title: 'Contact | APIVEL',
    description:
      'Contact APIVEL support and engineering for API gateway assistance, billing inquiries, and enterprise SLA plans.',
  },
  '/acceptable-use': {
    title: 'Acceptable Use Policy | APIVEL',
    description:
      "Review APIVEL's Acceptable Use Policy for API gateway requests, security, and compliance standards.",
  },
  '/review-info': {
    title: 'Business Review Info | APIVEL',
    description:
      'Company, service architecture, and compliance information for APIVEL operated by Astrapix LLC.',
  },
}

function normalizeCanonicalPath(pathname: string): string {
  let clean = (pathname || '/').trim()
  if (!clean.startsWith('/')) {
    clean = `/${clean}`
  }
  if (clean.length > 1) {
    clean = clean.replace(/\/+$/, '') || '/'
  }
  return CANONICAL_PATH_ALIASES[clean] ?? clean
}

function shouldNoIndex(cleanPath: string, searchStr: string): boolean {
  if (searchStr) {
    const params = new URLSearchParams(searchStr)
    if (params.has('redirect')) {
      return true
    }
  }
  return NOINDEX_PREFIXES.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
  )
}

function getRouteMeta(cleanPath: string): RouteSeoMeta | null {
  if (STATIC_ROUTE_META[cleanPath]) {
    return STATIC_ROUTE_META[cleanPath]
  }
  if (cleanPath.startsWith('/pricing/')) {
    const modelId = decodeURIComponent(cleanPath.slice('/pricing/'.length))
    if (modelId && !modelId.includes('/')) {
      return {
        title: `${modelId} API Pricing & Token Rates | APIVEL`,
        description: `Check live ${modelId} API pricing per 1M input and output tokens, context window, and OpenAI-compatible integration on APIVEL.`,
      }
    }
  }
  return null
}

function setMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  let el = document.querySelector(
    `meta[${attrName}="${attrValue}"]`
  ) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonicalLink(href: string | null): void {
  const existing = document.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null
  if (!href) {
    existing?.remove()
    return
  }
  if (existing) {
    existing.setAttribute('href', href)
    return
  }
  const link = document.createElement('link')
  link.setAttribute('rel', 'canonical')
  link.setAttribute('href', href)
  document.head.appendChild(link)
}

export function useRouteSeo(): void {
  const { pathname, searchStr } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      searchStr: s.location.searchStr,
    }),
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const cleanPath = normalizeCanonicalPath(pathname)
    const noIndex = shouldNoIndex(cleanPath, searchStr)
    const canonicalUrl = `${CANONICAL_ORIGIN}${cleanPath}`

    if (noIndex) {
      setCanonicalLink(null)
      setMetaTag('name', 'robots', NOINDEX_ROBOTS)
    } else {
      setCanonicalLink(canonicalUrl)
      setMetaTag('name', 'robots', DEFAULT_ROBOTS)
      setMetaTag('property', 'og:url', canonicalUrl)
      setMetaTag('name', 'twitter:url', canonicalUrl)
    }

    const meta = getRouteMeta(cleanPath)
    if (meta) {
      document.title = meta.title
      setMetaTag('name', 'title', meta.title)
      setMetaTag('property', 'og:title', meta.title)
      setMetaTag('name', 'twitter:title', meta.title)
      setMetaTag('name', 'description', meta.description)
      setMetaTag('property', 'og:description', meta.description)
      setMetaTag('name', 'twitter:description', meta.description)
    }
  }, [pathname, searchStr])
}


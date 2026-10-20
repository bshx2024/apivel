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
import { useState, useEffect, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { useStatus } from '@/hooks/use-status'
import { useOAuthLogin } from '@/features/auth/hooks/use-oauth-login'
import { X, Sparkles, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { SiGithub, SiGoogle } from 'react-icons/si'

export function ReturningVisitorCTA() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const { status } = useStatus()
  const [isVisible, setIsVisible] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
  const { handleGitHubLogin, handleGoogleLogin, isLoading: isOAuthLoading } = useOAuthLogin(currentPath)

  useEffect(() => {
    // If user is logged in, do not show the CTA
    if (user) {
      setIsVisible(false)
      return
    }

    const dismissedTimeKey = 'apivel_cta_dismissed_at'
    const visitCountKey = 'apivel_visit_count'
    const lastVisitKey = 'apivel_last_visit_time'
    const sessionViewsKey = 'apivel_session_views'

    // Check if dismissed within the last 24 hours
    const lastDismissedAt = parseInt(localStorage.getItem(dismissedTimeKey) || '0', 10)
    const now = Date.now()
    if (lastDismissedAt && now - lastDismissedAt < 24 * 60 * 60 * 1000) {
      return
    }

    // Track session page views
    const sessionViews = parseInt(sessionStorage.getItem(sessionViewsKey) || '0', 10) + 1
    sessionStorage.setItem(sessionViewsKey, sessionViews.toString())

    // Track total visits in localStorage
    const visitCount = parseInt(localStorage.getItem(visitCountKey) || '0', 10)
    const lastVisitTime = parseInt(localStorage.getItem(lastVisitKey) || '0', 10)

    let newVisitCount = visitCount
    if (now - lastVisitTime > 5 * 60 * 1000) {
      newVisitCount = visitCount + 1
      localStorage.setItem(visitCountKey, newVisitCount.toString())
      localStorage.setItem(lastVisitKey, now.toString())
    }

    // High-intent target pages
    const isTargetPage =
      currentPath.startsWith('/pricing') ||
      currentPath.startsWith('/docs') ||
      currentPath.startsWith('/blog') ||
      currentPath === '/' ||
      currentPath.includes('/how-to-') ||
      currentPath.includes('-guide')

    // Trigger condition:
    // 1. Returning visitor (visitCount >= 2 or sessionViews >= 2) -> show after 2.5s
    // 2. First-time deep reader on target pages -> show after 6s of reading
    let timer: NodeJS.Timeout | null = null

    if (isTargetPage) {
      const delayMs = newVisitCount >= 2 || sessionViews >= 2 ? 2500 : 6000
      timer = setTimeout(() => {
        setIsVisible(true)
      }, delayMs)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [user, currentPath])

  const handleDismiss = () => {
    localStorage.setItem('apivel_cta_dismissed_at', Date.now().toString())
    setIsVisible(false)
  }

  const onGitHubClick = () => {
    startTransition(() => {
      handleGitHubLogin()
    })
  }

  const onGoogleClick = () => {
    startTransition(() => {
      handleGoogleLogin()
    })
  }

  if (!isVisible || user) {
    return null
  }

  const hasGitHub = status?.github_oauth
  const hasGoogle = status?.google_oauth

  return (
    <aside
      id='apivel-returning-cta'
      aria-label={t('Instant Developer Free Trial')}
      className='fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] rounded-2xl border border-blue-500/25 dark:border-blue-400/20 bg-background/95 backdrop-blur-2xl p-4.5 sm:p-5 shadow-[0_12px_40px_rgba(37,99,235,0.16)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5'
    >
      <button
        onClick={handleDismiss}
        className='absolute top-3 right-3 flex size-6 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors cursor-pointer'
        aria-label='Close notification'
      >
        <X className='size-3.5' />
      </button>

      <div className='space-y-3 text-left'>
        {/* Header Tag */}
        <div className='flex items-center gap-1.5 flex-wrap pr-6'>
          <span className='inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-500/15 dark:bg-blue-400/10 px-2.5 py-0.5 rounded-full border border-blue-500/20'>
            <Sparkles className='size-3 text-amber-500' />
            {t('Instant Free Trial · No Card Needed')}
          </span>
          <span className='inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full'>
            <CheckCircle2 className='size-2.5' />
            {t('Claim $0.20 Credit')}
          </span>
        </div>

        {/* Title & Body */}
        <div>
          <h4 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
            {t('Test Top AI Models Instantly')}
          </h4>
          <p className='text-xs text-muted-foreground/90 mt-1 leading-relaxed'>
            {t('No credit card required. 1-Click login to claim your free $0.20 welcome quota and access DeepSeek V4, Qwen 3.8 & GLM 5.3 via unified OpenAI-compatible endpoint.')}
          </p>
        </div>

        {/* 1-Click Action Buttons */}
        <div className='pt-1 space-y-2'>
          <div className='flex items-center gap-2 flex-wrap sm:flex-nowrap'>
            {hasGitHub ? (
              <button
                type='button'
                onClick={onGitHubClick}
                disabled={isOAuthLoading || isPending}
                className='flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white px-3 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50'
              >
                {isOAuthLoading || isPending ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <SiGithub className='size-3.5' />
                )}
                <span>{t('Continue with GitHub')}</span>
              </button>
            ) : (
              <Link
                to='/sign-up'
                search={{ redirect: currentPath }}
                className='flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 text-xs font-bold shadow-sm transition-colors cursor-pointer'
              >
                <span>{t('Claim Free $0.20')}</span>
                <ArrowRight className='size-3.5' />
              </Link>
            )}

            {hasGoogle && (
              <button
                type='button'
                onClick={onGoogleClick}
                disabled={isOAuthLoading || isPending}
                className='inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border/70 hover:bg-muted px-3 text-xs font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-50'
                title={t('Continue with Google')}
              >
                <SiGoogle className='size-3.5 text-[#4285F4]' />
                <span className='hidden sm:inline'>{t('Google')}</span>
              </button>
            )}

            {hasGitHub && (
              <Link
                to='/sign-up'
                search={{ redirect: currentPath }}
                className='inline-flex h-9 items-center justify-center rounded-xl border border-border/50 hover:bg-muted px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
              >
                {t('Email')}
              </Link>
            )}
          </div>

          <div className='flex items-center justify-between text-[11px] text-muted-foreground/80 px-0.5 pt-0.5'>
            <span>{t('Standard OpenAI SDK compatible')}</span>
            <button
              onClick={handleDismiss}
              className='hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer'
            >
              {t('Maybe later')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}


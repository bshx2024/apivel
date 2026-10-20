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
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AnimatedOutlet } from '@/components/page-transition'
import { SkipToMain } from '@/components/skip-to-main'
import { triggerQuotaDepletedModal } from '@/components/quota-depleted-modal'
import { QuickstartDialog } from '@/components/quickstart-dialog'
import { WorkspaceProvider } from '../context/workspace-context'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout(props: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const user = useAuthStore((state) => state.auth.user)
  const { t } = useTranslation()
  const [quickstartOpen, setQuickstartOpen] = useState(false)

  const quota = user?.quota ?? 0
  const isZeroQuota = !!user && quota <= 0
  const isLowQuota = !!user && quota > 0 && quota < 100000
  const isNewUserTrial = !!user && user.request_count === 0 && quota >= 100000
  const [dismissedTrialBanner, setDismissedTrialBanner] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('apivel_dismiss_trial_banner') === 'true'
  })

  // Listen to global open-quickstart event from banners or secondary nudges
  useEffect(() => {
    const handleOpenQuickstart = () => {
      setQuickstartOpen(true)
    }
    window.addEventListener('apivale:open-quickstart', handleOpenQuickstart)
    return () => {
      window.removeEventListener('apivale:open-quickstart', handleOpenQuickstart)
    }
  }, [])

  // Automatically trigger quickstart onboarding modal for new users across any landing route
  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const forceQuickstart =
      urlParams.get('quickstart') === 'true' || urlParams.get('new_user') === 'true'
    const hasSeen = localStorage.getItem('apivel_has_seen_quickstart') === 'true'

    const isNewUser = forceQuickstart || (user.request_count === 0 && !hasSeen)
    if (isNewUser) {
      const timer = setTimeout(() => {
        setQuickstartOpen(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [user])

  // Automatically trigger high-conversion special offer modal once per session when quota is depleted
  useEffect(() => {
    if (user && isZeroQuota) {
      try {
        const hasShown = sessionStorage.getItem('apivale-quota-modal-auto-shown')
        if (!hasShown) {
          sessionStorage.setItem('apivale-quota-modal-auto-shown', 'true')
          const timer = setTimeout(() => {
            triggerQuotaDepletedModal()
          }, 800)
          return () => clearTimeout(timer)
        }
      } catch {
        /* empty */
      }
    }
  }, [user, isZeroQuota])

  return (
    <LayoutProvider>
      <SearchProvider>
        <WorkspaceProvider>
          <SidebarProvider defaultOpen={defaultOpen} className='flex-col'>
            <SkipToMain />
            <AppHeader />
            <div className='flex min-h-0 w-full flex-1'>
              <AppSidebar />
              <SidebarInset
                className={cn(
                  '@container/content',
                  'h-[calc(100svh-var(--app-header-height,0px))]',
                  'peer-data-[variant=inset]:h-[calc(100svh-var(--app-header-height,0px)-(var(--spacing)*4))]'
                )}
              >
                {isZeroQuota && (
                  <div className='bg-gradient-to-r from-red-500/15 via-orange-500/10 to-red-500/15 border-b border-red-500/30 px-4 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex flex-col sm:flex-row gap-2 sm:items-center justify-between backdrop-blur-md shadow-xs'>
                    <div className='flex items-center gap-2'>
                      <span className='text-base shrink-0 animate-pulse'>⛔</span>
                      <span>
                        {!user.github_id
                          ? t('Your balance is 0. Bind GitHub for $0.20 free credit (~300K Tokens) or top up $2 at 34% OFF ($1.32 for ~1.8M Tokens) to keep Claude Code / Cursor running!')
                          : t('Quota Exhausted: Your API requests are paused. Top up $2 at 34% OFF (Only $1.32) for ~1.8M Tokens (Save 72% vs official API pricing) & resume coding!')}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 self-start sm:self-auto shrink-0'>
                      {!user.github_id && (
                        <Link
                          to='/profile'
                          className='inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer whitespace-nowrap'
                        >
                          {t('Bind GitHub ($0.20 Free)')}
                        </Link>
                      )}
                      <Link
                        to='/wallet'
                        search={{ amount: 2 }}
                        className='inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-red-700 hover:to-orange-700 transition-all shadow-md shadow-red-500/20 cursor-pointer whitespace-nowrap'
                      >
                        🔥 {t('Get 34% OFF ($1.32)')}
                      </Link>
                    </div>
                  </div>
                )}
                {isLowQuota && (
                  <div className='bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs sm:text-sm text-amber-600 dark:text-amber-400 flex flex-col sm:flex-row gap-2 sm:items-center justify-between backdrop-blur-md shadow-xs'>
                    <div className='flex items-center gap-2'>
                      <span className='text-base shrink-0'>⚠️</span>
                      <span>
                        {t('Low Quota Notice: Your balance is running low (< $0.20). Top up $2 at 34% OFF (Only $1.32) to keep your Claude Code & Cursor uninterrupted!')}
                      </span>
                    </div>
                    <Link
                      to='/wallet'
                      search={{ amount: 2 }}
                      className='self-start sm:self-auto shrink-0 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-amber-700 hover:to-orange-700 transition-all shadow-md shadow-amber-500/20 cursor-pointer whitespace-nowrap'
                    >
                      🔥 {t('Top Up $1.32 (34% OFF)')}
                    </Link>
                  </div>
                )}
                {isNewUserTrial && !dismissedTrialBanner && (
                  <div className='bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex flex-col sm:flex-row gap-2 sm:items-center justify-between backdrop-blur-md shadow-xs animate-in fade-in duration-300'>
                    <div className='flex items-center gap-2'>
                      <span className='text-base shrink-0'>🎁</span>
                      <span>
                        <strong className='font-semibold'>{t('Complimentary $0.20 Trial Active (~300,000 Tokens):')}</strong>{' '}
                        {t('No top-up required! Test DeepSeek V4, Qwen 3.8, GLM 5.3 & Kimi directly in browser or code.')}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 self-start sm:self-auto shrink-0'>
                      <Link
                        to='/playground'
                        search={{ model: 'deepseek-v4-flash' }}
                        className='inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap'
                      >
                        💬 {t('Chat Now')}
                      </Link>
                      <button
                        type='button'
                        onClick={() => setQuickstartOpen(true)}
                        className='inline-flex items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap'
                      >
                        ⚡ {t('Get Key')}
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          sessionStorage.setItem('apivel_dismiss_trial_banner', 'true')
                          setDismissedTrialBanner(true)
                        }}
                        className='text-muted-foreground hover:text-foreground text-xs px-1.5 py-0.5'
                        title={t('Dismiss')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                {props.children ?? <AnimatedOutlet />}
              </SidebarInset>
            </div>
            <QuickstartDialog open={quickstartOpen} onOpenChange={setQuickstartOpen} />
          </SidebarProvider>
        </WorkspaceProvider>
      </SearchProvider>
    </LayoutProvider>
  )
}

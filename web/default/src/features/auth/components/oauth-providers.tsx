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
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IconDiscord,
  IconGithub,
  IconGoogle,
  IconLinuxDo,
  IconWeChat,
} from '@/assets/brand-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useOAuthLogin } from '../hooks/use-oauth-login'
import type { SystemStatus } from '../types'

type OAuthProvidersProps = {
  status: SystemStatus | null
  disabled?: boolean
  className?: string
  onWeChatLogin?: () => void
  isWeChatLoading?: boolean
  onBeforeOAuthClick?: () => boolean
  redirect?: string
}

type ProviderButton = {
  key: string
  label: string
  onClick: () => void
  icon?: ReactNode
  disabled?: boolean
}

export function OAuthProviders({
  status,
  disabled = false,
  className,
  onWeChatLogin,
  isWeChatLoading = false,
  onBeforeOAuthClick,
  redirect,
}: OAuthProvidersProps) {
  const { t } = useTranslation()
  const {
    isLoading,
    githubButtonText,
    githubButtonDisabled,
    handleGitHubLogin,
    handleGoogleLogin,
    handleDiscordLogin,
    handleOIDCLogin,
    handleLinuxDOLogin,
    handleTelegramLogin,
    handleCustomOAuthLogin,
  } = useOAuthLogin(status, redirect)

  useEffect(() => {
    if (status?.google_oauth && status?.google_client_id) {
      const scriptId = 'google-jssdk'
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.body.appendChild(script)
      }
    }
  }, [status?.google_oauth, status?.google_client_id])

  const wrapOAuthHandler = (handler: () => void) => {
    return () => {
      if (onBeforeOAuthClick && !onBeforeOAuthClick()) {
        return
      }
      handler()
    }
  }

  const providerButtons: ProviderButton[] = []

  if (status?.wechat_login && onWeChatLogin) {
    providerButtons.push({
      key: 'wechat',
      label: t('Continue with WeChat'),
      onClick: onWeChatLogin,
      icon: <IconWeChat className='h-4 w-4' />,
      disabled: isWeChatLoading,
    })
  }

  if (status?.google_oauth) {
    providerButtons.push({
      key: 'google',
      label: t('Continue with Google'),
      onClick: wrapOAuthHandler(handleGoogleLogin),
      icon: <IconGoogle className='h-4 w-4' />,
    })
  }

  if (status?.github_oauth) {
    providerButtons.push({
      key: 'github',
      label: githubButtonText || t('Continue with GitHub'),
      onClick: wrapOAuthHandler(handleGitHubLogin),
      icon: <IconGithub className='h-4 w-4' />,
      disabled: githubButtonDisabled,
    })
  }

  if (status?.discord_oauth) {
    providerButtons.push({
      key: 'discord',
      label: t('Continue with Discord'),
      onClick: wrapOAuthHandler(handleDiscordLogin),
      icon: <IconDiscord className='h-4 w-4' />,
    })
  }

  if (status?.oidc_enabled) {
    providerButtons.push({
      key: 'oidc',
      label: t('Continue with OIDC'),
      onClick: wrapOAuthHandler(handleOIDCLogin),
    })
  }

  if (status?.linuxdo_oauth) {
    providerButtons.push({
      key: 'linuxdo',
      label: t('Continue with LinuxDO'),
      onClick: wrapOAuthHandler(handleLinuxDOLogin),
      icon: <IconLinuxDo className='h-4 w-4' />,
    })
  }

  if (status?.telegram_oauth) {
    providerButtons.push({
      key: 'telegram',
      label: t('Continue with Telegram'),
      onClick: wrapOAuthHandler(handleTelegramLogin),
    })
  }

  // Custom OAuth providers
  const customProviders = status?.custom_oauth_providers
  if (customProviders && customProviders.length > 0) {
    for (const provider of customProviders) {
      providerButtons.push({
        key: `custom-${provider.slug}`,
        label: t('Continue with {{name}}', { name: provider.name }),
        onClick: wrapOAuthHandler(() => handleCustomOAuthLogin(provider)),
      })
    }
  }

  if (providerButtons.length === 0) return null

  const isSignUp = typeof window !== 'undefined' ? window.location.pathname.includes('sign-up') : true
  const primaryKeys = new Set(['github', 'google'])
  const primaryButtons = providerButtons.filter(b => primaryKeys.has(b.key))
  const secondaryButtons = providerButtons.filter(b => !primaryKeys.has(b.key))

  return (
    <div className={cn('space-y-3', className)}>
      {/* Primary 1-Click OAuth Providers: GitHub & Google */}
      <div className='flex flex-col gap-2'>
        {primaryButtons.map(({ key, label, onClick, icon, disabled: extraDisabled }) => {
          const isGitHub = key === 'github'
          const isGoogle = key === 'google'

          return (
            <Button
              key={key}
              variant='outline'
              type='button'
              disabled={disabled || isLoading || extraDisabled}
              onClick={onClick}
              className={cn(
                'w-full justify-between px-4 rounded-xl relative overflow-hidden transition-all duration-200 shadow-xs cursor-pointer',
                isGitHub
                  ? 'h-12 sm:h-12.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 font-bold text-sm border-2 border-neutral-800 dark:border-neutral-200 hover:scale-[1.005]'
                  : isGoogle
                  ? 'h-12 sm:h-12.5 bg-background text-foreground hover:bg-accent border-2 border-primary/25 hover:border-primary/50 font-bold text-sm hover:scale-[1.005]'
                  : 'h-11 border-primary/20 hover:border-primary/50'
              )}
            >
              <div className='flex items-center gap-2.5'>
                {icon}
                <span className='text-sm font-bold'>{label}</span>
              </div>
              {isGitHub && (
                <span className='inline-flex items-center gap-1 bg-amber-500 text-amber-950 text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-400 shadow-xs animate-pulse'>
                  ⚡ 24H PASS
                </span>
              )}
              {isGoogle && (
                <span className='inline-flex items-center gap-1 bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-500/25'>
                  ⚡ 1-CLICK PASS
                </span>
              )}
            </Button>
          )
        })}

        {/* 1-Click Welcome Callout for Sign Up */}
        {isSignUp && primaryButtons.length > 0 && (
          <div className='flex items-center justify-center gap-1 text-[11px] sm:text-xs text-amber-950 dark:text-amber-200 font-medium py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 text-center shadow-xs'>
            <span>
              ⚡ <strong className='font-bold text-amber-950 dark:text-amber-100'>{t('1-Click Instant Access:', '1 秒免密极速直达：')}</strong>{' '}
              {t(
                'Register via GitHub or Google to receive 100,000 API Tokens ($0.20 credit) instantly — zero email verification code needed.',
                '使用 GitHub 或 Google 授权即可秒级到账 100,000 API Tokens（$0.20 免费额度），无需等待邮箱验证码。'
              )}
            </span>
          </div>
        )}
      </div>

      {/* Secondary Providers (WeChat, Discord, LinuxDO, OIDC, etc.) */}
      {secondaryButtons.length > 0 && (
        <div className='flex flex-col gap-2 pt-1'>
          {secondaryButtons.map(({ key, label, onClick, icon, disabled: extraDisabled }) => (
            <Button
              key={key}
              variant='outline'
              type='button'
              disabled={disabled || isLoading || extraDisabled}
              onClick={onClick}
              className='h-10 justify-start px-3.5 rounded-xl border-border/70 hover:border-primary/40 text-xs font-semibold'
            >
              <div className='flex items-center gap-2'>
                {icon}
                <span>{label}</span>
              </div>
            </Button>
          ))}
        </div>
      )}

      <div className='relative pt-3 pb-1'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t border-neutral-200 dark:border-neutral-800' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-3 font-semibold tracking-wider'>
            {t('Or continue with email')}
          </span>
        </div>
      </div>
    </div>
  )
}

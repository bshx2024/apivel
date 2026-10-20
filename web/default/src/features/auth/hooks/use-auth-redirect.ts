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
import { useNavigate } from '@tanstack/react-router'
import i18n from 'i18next'
import { useAuthStore } from '@/stores/auth-store'
import { getSelf } from '@/lib/api'
import type { User } from '@/features/users/types'
import { saveUserId } from '../lib/storage'

function getSavedLanguage(user: User): string | undefined {
  const userData = user as Record<string, unknown>
  if (typeof userData.language === 'string') {
    return userData.language
  }

  if (typeof userData.setting !== 'string') {
    return undefined
  }

  try {
    const setting = JSON.parse(userData.setting) as { language?: unknown }
    return typeof setting.language === 'string' ? setting.language : undefined
  } catch {
    return undefined
  }
}

/**
 * Hook for handling authentication redirects and user data management
 */
export function useAuthRedirect() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  /**
   * Handle successful login
   * @param userData - Optional user data from login response
   * @param redirectTo - Redirect path after login
   */
  const handleLoginSuccess = async (
    userData?: { id?: number } | null,
    redirectTo?: string
  ) => {
    // Save user ID if available
    if (userData?.id) {
      saveUserId(userData.id)
    }

    // Fetch and set user data
    try {
      const self = await getSelf()
      if (self?.success && self.data) {
        const user = self.data as User
        auth.setUser(user)

        // Update user ID if not already set
        if (user.id) {
          saveUserId(user.id)
        }

        // Restore saved language preference
        const savedLang = getSavedLanguage(user)
        if (savedLang && savedLang !== i18n.language) {
          i18n.changeLanguage(savedLang)
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    }

    // Navigate to target page
    let targetPath = redirectTo || '/dashboard'

    if (typeof window !== 'undefined') {
      // Direct jump to Playground with welcome bonus activation
      if (targetPath.startsWith('/playground') || targetPath.includes('/playground')) {
        const separator = targetPath.includes('?') ? '&' : '?'
        if (!targetPath.includes('welcome=')) {
          targetPath = `${targetPath}${separator}welcome=true`
        }
        window.location.href = targetPath
        return
      }

      // If user comes from a technical blog tutorial, direct them straight to Playground or Claude Code quickstart
      // and preserve tutorial URL in sessionStorage for one-click return
      if (targetPath.startsWith('/blog') || targetPath.includes('/blog/')) {
        if (targetPath.startsWith('/blog') && !targetPath.endsWith('/') && !targetPath.includes('.')) {
          targetPath += '/'
        }
        try {
          sessionStorage.setItem('apivel_from_blog_url', targetPath)
        } catch {}

        if (targetPath.includes('claude-code') || targetPath.includes('claude')) {
          window.location.href = `/dashboard?quickstart=true&tab=claude&welcome=true`
          return
        }

        if (targetPath.includes('muse') || targetPath.includes('qwen')) {
          window.location.href = `/dashboard?quickstart=true&welcome=true`
          return
        }

        window.location.href = `/playground?from_blog=${encodeURIComponent(targetPath)}&welcome=true`
        return
      }

      // For new users with 0 requests, ensure onboarding quickstart is triggered on landing
      if (user && user.request_count === 0) {
        const sep = targetPath.includes('?') ? '&' : '?'
        if (!targetPath.includes('quickstart=') && !targetPath.includes('new_user=')) {
          targetPath = `${targetPath}${sep}new_user=true&welcome=true`
        }
      }

      window.location.href = targetPath
    }
  }

  /**
   * Redirect to 2FA page
   */
  const redirectTo2FA = () => {
    navigate({ to: '/otp', replace: true })
  }

  /**
   * Redirect to login page
   */
  const redirectToLogin = (redirectTo?: string) => {
    navigate({
      to: '/sign-in',
      search: redirectTo ? { redirect: redirectTo } : undefined,
      replace: true,
    })
  }

  /**
   * Redirect to register page
   */
  const redirectToRegister = (redirectTo?: string) => {
    navigate({
      to: '/sign-up',
      search: redirectTo ? { redirect: redirectTo } : undefined,
      replace: true,
    })
  }

  return {
    handleLoginSuccess,
    redirectTo2FA,
    redirectToLogin,
    redirectToRegister,
  }
}

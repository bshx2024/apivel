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
import { useEffect, useMemo, useState } from 'react'
import type { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/password-input'
import { Turnstile } from '@/components/turnstile'
import { register, login, wechatLoginByCode } from '@/features/auth/api'
import { LegalConsent } from '@/features/auth/components/legal-consent'
import { OAuthProviders } from '@/features/auth/components/oauth-providers'
import { registerFormSchema } from '@/features/auth/constants'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useEmailVerification } from '@/features/auth/hooks/use-email-verification'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { getAffiliateCode } from '@/features/auth/lib/storage'
import { trackGoogleAdsSignUpConversion } from '@/lib/tracker'

interface SignUpFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirect?: string
}

export function SignUpForm({
  className,
  redirect,
  ...props
}: SignUpFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [agreedToLegal, setAgreedToLegal] = useState(false)
  const [wechatCode, setWeChatCode] = useState('')
  const [isWeChatDialogOpen, setIsWeChatDialogOpen] = useState(false)
  const [isWeChatSubmitting, setIsWeChatSubmitting] = useState(false)
  // Increment to force Turnstile widget remount after token is consumed by "Send code"
  const [turnstileKey, setTurnstileKey] = useState(0)
  const legalConsentErrorMessage = t('Please agree to the legal terms first')

  const { status } = useStatus()
  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile(true)
  const { handleLoginSuccess } = useAuthRedirect()
  const {
    isSending: isSendingCode,
    secondsLeft,
    isActive,
    sendCode,
  } = useEmailVerification({
    turnstileToken,
    validateTurnstile,
  })

  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  })

  const emailValue = form.watch('email')
  const emailVerificationRequired = !!status?.email_verification
  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)
  const requiresLegalConsent = hasUserAgreement || hasPrivacyPolicy
  const oauthRegisterEnabled =
    status?.oauth_register_enabled ??
    status?.data?.oauth_register_enabled ??
    true
  const hasWeChatLogin = Boolean(status?.wechat_login)

  const wechatQrCodeUrl = useMemo(() => {
    return (
      status?.wechat_qrcode ||
      status?.wechat_qr_code ||
      status?.wechat_qrcode_image_url ||
      status?.wechat_qr_code_image_url ||
      status?.wechat_account_qrcode_image_url ||
      status?.WeChatAccountQRCodeImageURL ||
      status?.data?.wechat_qrcode ||
      status?.data?.WeChatAccountQRCodeImageURL ||
      ''
    )
  }, [status])

  useEffect(() => {
    setAgreedToLegal(true)
  }, [])

  const handleBeforeOAuthClick = () => {
    return true
  }

  async function onSubmit(data: z.infer<typeof registerFormSchema>) {

    // Validate email verification if required
    if (emailVerificationRequired) {
      if (!data.email) {
        toast.error(t('Please enter your email'))
        return
      }
      if (!verificationCode) {
        toast.error(t('Please enter the verification code'))
        return
      }
    }

    setIsLoading(true)
    try {
      const res = await register({
        username: data.username,
        password: data.password,
        email: data.email || undefined,
        verification_code: verificationCode || undefined,
        aff: getAffiliateCode(),
        turnstile: turnstileToken,
      })

      if (res?.success) {
        trackGoogleAdsSignUpConversion()
        toast.success(t('🎁 Account created! Free $0.20 credits added — redirecting...'))
        // Auto-login: attempt login with credentials, then redirect directly to dashboard
        try {
          const loginRes = await login({
            username: data.username,
            password: data.password,
          })
          if (loginRes?.success) {
            await handleLoginSuccess(loginRes.data as { id?: number } | null, redirect)
            return
          }
        } catch {
          // If auto-login fails (e.g. email verification required before login),
          // fall through to sign-in page
        }
        // Fallback: redirect to sign-in with redirect param preserved
        window.location.href = redirect
          ? `/sign-in?redirect=${encodeURIComponent(redirect)}`
          : '/sign-in'
      }
    } catch (_error) {
      // Errors are handled by global interceptor
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendVerificationCode() {
    const ok = await sendCode(emailValue || '')
    if (ok) {
      // The Turnstile token was consumed by the verification request.
      // Reset the widget so a fresh token is generated for the register request.
      setTurnstileToken('')
      setTurnstileKey((k) => k + 1)
    }
  }

  const handleOpenWeChatDialog = () => {
    if (requiresLegalConsent && !agreedToLegal) {
      toast.error(legalConsentErrorMessage)
      return
    }

    setIsWeChatDialogOpen(true)
  }

  const handleWeChatDialogChange = (open: boolean) => {
    setIsWeChatDialogOpen(open)
    if (!open) {
      setWeChatCode('')
      setIsWeChatSubmitting(false)
    }
  }

  async function handleWeChatLogin() {
    if (!wechatCode.trim()) {
      toast.error(t('Please enter the verification code'))
      return
    }

    setIsWeChatSubmitting(true)
    try {
      const res = await wechatLoginByCode(wechatCode)
      if (res?.success) {
        await handleLoginSuccess(res.data as { id?: number } | null, redirect)
        toast.success(t('Signed in via WeChat'))
        handleWeChatDialogChange(false)
      } else {
        toast.error(res?.message || t('Login failed'))
      }
    } catch (_error) {
      toast.error(t('Login failed'))
    } finally {
      setIsWeChatSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        {/* Dynamic Context Onboarding Header: Blog Bridge vs Universal Zero-Card */}
        {redirect && (redirect.startsWith('/blog') || redirect.includes('/blog/')) ? (
          <div className='rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-3.5 text-xs shadow-sm space-y-1.5'>
            <div className='flex items-center gap-2'>
              <span className='flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold'>
                🎯
              </span>
              <span className='font-bold text-sm text-foreground'>
                {t('signup_blog_bridge_title', 'Continuing from Tutorial Guide')}
              </span>
              <span className='rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30 ml-auto'>
                🎁 $0.20 Free Trial
              </span>
            </div>
            <p className='text-muted-foreground leading-relaxed pl-8'>
              {t(
                'signup_blog_bridge_desc',
                'Complete this 5-second setup to claim your API key and $0.20 free credits (~300,000 tokens). Instant access to flagship DeepSeek V4, Qwen 3.8, GLM 5.3 & Kimi with zero card verification. Ready for in-browser Playground, Claude Code CLI & Cursor.'
              )}
            </p>
          </div>
        ) : (
          <div className='rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 p-3.5 text-xs shadow-sm space-y-1.5'>
            <div className='flex items-center gap-2'>
              <span className='flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold'>
                ⚡
              </span>
              <span className='font-bold text-sm text-foreground'>
                {t('signup_universal_credit_title', 'Zero Card Required · $0.20 Free Credits')}
              </span>
              <span className='rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30 ml-auto'>
                100,000 Tokens
              </span>
            </div>
            <p className='text-muted-foreground leading-relaxed pl-8'>
              {t(
                'signup_universal_credit_desc',
                'Sign up in 5 seconds to get $0.20 free test credits automatically. Test DeepSeek-V4.1 Flash, GLM-5.3 & Qwen 3.8 instantly with zero card verification.'
              )}
            </p>
          </div>
        )}

        {/* Primary Action: GitHub OAuth Button at Top */}
        {oauthRegisterEnabled && (
          <OAuthProviders
            status={status}
            disabled={isLoading}
            onWeChatLogin={hasWeChatLogin ? handleOpenWeChatDialog : undefined}
            isWeChatLoading={isWeChatSubmitting}
            onBeforeOAuthClick={handleBeforeOAuthClick}
            redirect={redirect}
          />
        )}

        {/* Username Field */}
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Username')}</FormLabel>
              <FormControl>
                <Input placeholder={t('Enter your username')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder={t('Enter password (8-20 characters)')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Verification Section */}
        {emailVerificationRequired && (
          <>
            {/* Email Field */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Email (required for verification)')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('name@example.com')}
                      type='email'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Turnstile Human Verification (must be completed before sending code) */}
            {isTurnstileEnabled && (
              <div className='mt-1 mb-2 flex justify-center sm:justify-start'>
                <Turnstile
                  key={turnstileKey}
                  siteKey={turnstileSiteKey}
                  onVerify={setTurnstileToken}
                />
              </div>
            )}

            {/* Verification Code Field */}
            <div className='flex items-end gap-2'>
              <div className='flex-1'>
                <Input
                  placeholder={t('Verification code')}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
              <Button
                variant='outline'
                type='button'
                disabled={isLoading || isSendingCode || isActive || !emailValue || (isTurnstileEnabled && !turnstileToken)}
                onClick={handleSendVerificationCode}
                title={isTurnstileEnabled && !turnstileToken ? t('Please complete the verification below first') : undefined}
              >
                {isActive ? (
                  t('Resend ({{seconds}}s)', { seconds: secondsLeft })
                ) : isSendingCode ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  t('Send code')
                )}
              </Button>
            </div>
          </>
        )}

        {/* Submit Button */}
        <Button
          type='submit'
          className='mt-2 w-full justify-center gap-2'
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
          {t('Create account')}
        </Button>

        <LegalConsent
          status={status}
          checked={agreedToLegal}
          onCheckedChange={setAgreedToLegal}
          className='mt-1'
        />

        {/* Security, Privacy & Trust Badges */}
        <div className='mt-3 space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-muted-foreground backdrop-blur-sm'>
          <div className='flex items-center gap-2 font-medium text-foreground'>
            <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-[10px]'>🔒</span>
            <span><strong>Zero Prompt Logging</strong> — Strict privacy assurance. We never store or train on your chat history or prompts.</span>
          </div>
          <div className='flex items-center gap-2 font-medium text-foreground'>
            <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-[10px]'>⚡</span>
            <span><strong>99.9% SLA & Sub-50ms Routing</strong> — High-availability multi-region API proxy.</span>
          </div>
          <div className='flex items-center gap-2 font-medium text-foreground'>
            <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-500 text-[10px]'>🎁</span>
            <span><strong>Instant API Key & Zero Card</strong> — Granted immediately after registration. Credits never expire.</span>
          </div>
        </div>
      </form>

      {hasWeChatLogin && (
        <Dialog
          open={isWeChatDialogOpen}
          onOpenChange={handleWeChatDialogChange}
        >
          <DialogContent className='max-w-sm'>
            <DialogHeader className='text-left'>
              <DialogTitle>{t('WeChat sign in')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Scan the QR code to follow the official account and reply with “验证码” to receive your verification code.'
                )}
              </DialogDescription>
            </DialogHeader>

            {wechatQrCodeUrl ? (
              <div className='flex justify-center'>
                <img
                  src={wechatQrCodeUrl}
                  alt={t('WeChat login QR code')}
                  className='h-40 w-40 rounded-md border object-contain'
                />
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                {t('QR code is not configured. Please contact support.')}
              </p>
            )}

            <div className='grid gap-2'>
              <Label htmlFor='wechat-code'>{t('Verification code')}</Label>
              <Input
                id='wechat-code'
                placeholder={t('Enter the verification code')}
                value={wechatCode}
                onChange={(event) => setWeChatCode(event.target.value)}
                autoComplete='one-time-code'
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleWeChatDialogChange(false)}
                disabled={isWeChatSubmitting}
              >
                {t('Cancel')}
              </Button>
              <Button
                type='button'
                onClick={handleWeChatLogin}
                disabled={
                  isWeChatSubmitting ||
                  !wechatCode.trim() ||
                  (requiresLegalConsent && !agreedToLegal)
                }
                className='gap-2'
              >
                {isWeChatSubmitting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : null}
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Form>
  )
}

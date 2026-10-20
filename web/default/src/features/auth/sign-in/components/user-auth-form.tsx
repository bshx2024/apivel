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
import { Link } from '@tanstack/react-router'
import { Loader2, LogIn, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  buildAssertionResult,
  prepareCredentialRequestOptions,
  isPasskeySupported as detectPasskeySupport,
} from '@/lib/passkey'
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
import { login, wechatLoginByCode } from '@/features/auth/api'
import { LegalConsent } from '@/features/auth/components/legal-consent'
import { OAuthProviders } from '@/features/auth/components/oauth-providers'
import { loginFormSchema } from '@/features/auth/constants'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { beginPasskeyLogin, finishPasskeyLogin } from '@/features/auth/passkey'
import type { AuthFormProps } from '@/features/auth/types'

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: AuthFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [wechatCode, setWeChatCode] = useState('')
  const [agreedToLegal, setAgreedToLegal] = useState(false)
  const [passkeySupported, setPasskeySupported] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [isWeChatDialogOpen, setIsWeChatDialogOpen] = useState(false)
  const [isWeChatSubmitting, setIsWeChatSubmitting] = useState(false)
  const legalConsentErrorMessage = t('Please agree to the legal terms first')
  const loginFailedMessage = t('Login failed')

  const { status } = useStatus()
  const passkeyLoginEnabled = Boolean(
    status?.passkey_login ?? status?.data?.passkey_login
  )
  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
    isTurnstileFallback,
  } = useTurnstile()
  const { handleLoginSuccess, redirectTo2FA } = useAuthRedirect()

  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)
  const requiresLegalConsent = hasUserAgreement || hasPrivacyPolicy
  const passkeyButtonDisabled =
    isPasskeyLoading ||
    !passkeySupported
  const hasWeChatLogin = Boolean(status?.wechat_login)

  useEffect(() => {
    setAgreedToLegal(true)
  }, [])

  const handleBeforeOAuthClick = () => {
    return true
  }

  useEffect(() => {
    detectPasskeySupport()
      .then(setPasskeySupported)
      .catch(() => setPasskeySupported(false))
  }, [])

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

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

  const [requireTurnstile, setRequireTurnstile] = useState(false)
  const [requireOTP, setRequireOTP] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpTargetEmail, setOtpTargetEmail] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [isSendingOTP, setIsSendingOTP] = useState(false)

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return
    const timer = setInterval(() => setOtpCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [otpCooldown])

  async function handleSendOTP() {
    const username = form.getValues('username')
    if (!username) {
      toast.error(t('Please enter your username or email first'))
      return
    }
    setIsSendingOTP(true)
    try {
      const res = await sendLoginOTP(username)
      if (res.success) {
        toast.success(res.message || t('Verification code sent to your email'))
        setOtpCooldown(60)
        const email = (res.data as { email?: string })?.email
        if (email) setOtpTargetEmail(email)
      } else {
        toast.error(res.message)
      }
    } catch {
      /* handled */
    } finally {
      setIsSendingOTP(false)
    }
  }

  async function onSubmit(data: z.infer<typeof loginFormSchema>) {
    if (requireTurnstile && !validateTurnstile()) return

    setIsLoading(true)
    const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    try {
      const res = await login({
        username: data.username,
        password: data.password,
        turnstile: turnstileToken,
        request_id: requestId,
        otp_code: requireOTP ? otpCode : undefined,
        turnstile_failed: isTurnstileFallback,
      })

      if (res && res.success) {
        if (res.data?.require_2fa) {
          redirectTo2FA()
          return
        }

        try {
          await handleLoginSuccess(res.data as { id?: number } | null, redirectTo)
          toast.success(t('Welcome back!'))
        } catch (redirectErr) {
          console.error('Redirect failed, fallback reload:', redirectErr)
          window.location.href = redirectTo || '/dashboard'
        }
      } else {
        // 自适应风控状态流转
        if (res?.data?.require_turnstile) {
          setRequireTurnstile(true)
        }
        if (res?.data?.require_otp) {
          setRequireOTP(true)
          if (res?.data?.email) {
            setOtpTargetEmail(res.data.email)
          }
          if (otpCooldown === 0) {
            setOtpCooldown(60)
          }
        }
        if (res?.message) {
          toast.error(res.message)
        } else {
          toast.error(loginFailedMessage)
        }
      }
    } catch (error: unknown) {
      console.error('Login submit error:', error)
      const err = error as {
        message?: string
        response?: {
          data?: {
            message?: string
            data?: { require_turnstile?: boolean; require_otp?: boolean; email?: string }
          }
        }
      }
      const resData = err?.response?.data
      if (resData?.data?.require_turnstile) {
        setRequireTurnstile(true)
      }
      if (resData?.data?.require_otp) {
        setRequireOTP(true)
        if (resData?.data?.email) {
          setOtpTargetEmail(resData.data.email)
        }
        if (otpCooldown === 0) {
          setOtpCooldown(60)
        }
      }
      const errorMsg = resData?.message || err?.message || loginFailedMessage
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const onInvalid = (errors: unknown) => {
    const errorList = Object.values(errors as Record<string, { message?: string }>)
    if (errorList.length > 0 && errorList[0]?.message) {
      toast.error(t(errorList[0].message))
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
        await handleLoginSuccess(res.data as { id?: number } | null, redirectTo)
        toast.success(t('Signed in via WeChat'))
        handleWeChatDialogChange(false)
      } else {
        toast.error(res?.message || loginFailedMessage)
      }
    } catch (_error) {
      toast.error(loginFailedMessage)
    } finally {
      setIsWeChatSubmitting(false)
    }
  }

  async function handlePasskeyLogin() {
    if (requiresLegalConsent && !agreedToLegal) {
      toast.error(legalConsentErrorMessage)
      return
    }

    if (!passkeySupported) {
      toast.error(t('Passkey is not supported on this device'))
      return
    }

    if (!navigator?.credentials) {
      toast.error(t('Passkey is not available in this browser'))
      return
    }

    setIsPasskeyLoading(true)
    try {
      const begin = await beginPasskeyLogin()
      if (!begin.success) {
        throw new Error(begin.message || t('Failed to start Passkey login'))
      }

      const publicKey = prepareCredentialRequestOptions(
        begin.data?.options ?? begin.data
      )

      const credential = (await navigator.credentials.get({
        publicKey,
      })) as PublicKeyCredential | null

      if (!credential) {
        toast.info(t('Passkey login was cancelled'))
        return
      }

      const assertion = buildAssertionResult(credential)
      if (!assertion) {
        throw new Error(t('Invalid Passkey response'))
      }

      const finish = await finishPasskeyLogin(assertion)
      if (!finish.success) {
        throw new Error(finish.message || t('Failed to complete Passkey login'))
      }

      if (!finish.data) {
        throw new Error(t('Missing user data from Passkey login response'))
      }

      await handleLoginSuccess(
        finish.data as { id?: number } | null,
        redirectTo
      )
      toast.success(t('Signed in with Passkey'))
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.info(t('Passkey login was cancelled or timed out'))
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error(t('Passkey login failed'))
      }
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        {/* Primary Action: GitHub OAuth Button at Top */}
        <OAuthProviders
          status={status}
          disabled={isLoading}
          onWeChatLogin={hasWeChatLogin ? handleOpenWeChatDialog : undefined}
          isWeChatLoading={isWeChatSubmitting}
          onBeforeOAuthClick={handleBeforeOAuthClick}
          redirect={redirectTo}
        />

        {/* Username Field */}
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Username or Email')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('Enter your username or email')}
                  {...field}
                />
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
            <FormItem className='relative'>
              <FormLabel>{t('Password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder={t('Enter password')} {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                {t('Forgot password?')}
              </Link>
            </FormItem>
          )}
        />

        {/* Soft-Lock OTP Input Component */}
        {requireOTP && (
          <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300'>
            <div className='flex items-center justify-between text-xs'>
              <span className='font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5'>
                <span>🔒</span>
                <span>{t('Account Protected: Email OTP Required')}</span>
              </span>
              {otpTargetEmail && (
                <span className='text-muted-foreground'>{otpTargetEmail}</span>
              )}
            </div>
            <div className='flex gap-2 items-center'>
              <Input
                placeholder={t('Enter 6-digit code')}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                maxLength={6}
                className='font-mono tracking-widest text-center text-base bg-background'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleSendOTP}
                disabled={isSendingOTP || otpCooldown > 0}
                className='shrink-0 text-xs'
              >
                {isSendingOTP ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : otpCooldown > 0 ? (
                  `${otpCooldown}s`
                ) : (
                  t('Resend')
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Turnstile */}
        {isTurnstileEnabled && requireTurnstile && !isTurnstileFallback && (
          <div className='mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-2 animate-in fade-in duration-300'>
            <div className='text-xs text-muted-foreground mb-1.5 text-center font-medium'>
              ⚠️ {t('Security check required due to recent login attempts')}
            </div>
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
            />
          </div>
        )}

        {/* Submit Button */}
        <Button
          type='submit'
          className='mt-2 w-full justify-center gap-2'
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          {requireOTP ? t('Verify & Sign In') : t('Sign in')}
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
            <span><strong>Instant $0.20 Free Credits</strong> — 100,000 trial tokens granted automatically on signup.</span>
          </div>
        </div>

        {passkeyLoginEnabled && (
          <div className='mt-2 space-y-1'>
            <Button
              type='button'
              variant='outline'
              disabled={passkeyButtonDisabled}
              onClick={handlePasskeyLogin}
              className='h-11 w-full justify-center gap-2 rounded-lg'
            >
              {isPasskeyLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <KeyRound className='h-4 w-4' />
              )}
              {t('Sign in with Passkey')}
            </Button>
            {!passkeySupported && (
              <p className='text-muted-foreground text-xs'>
                {t('Passkey is not supported on this device.')}
              </p>
            )}
          </div>
        )}
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

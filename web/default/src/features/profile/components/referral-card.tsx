import { useState } from 'react'
import { Copy, Check, Gift, Users, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatQuota } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TitledCard } from '@/components/ui/titled-card'
import type { UserProfile } from '../types'

interface ReferralCardProps {
  profile: UserProfile | null
  loading?: boolean
}

export function ReferralCard({ profile, loading }: ReferralCardProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  if (loading || !profile) return null

  const affCode = profile.aff_code || ''
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://apivel.com'
  const referralLink = `${baseUrl}/sign-up?aff=${affCode}`

  const handleCopy = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success(t('Referral link copied to clipboard!'))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TitledCard
      title={t('Invite Developers & Earn Tokens')}
      description={t('Share your link. Earn ~300,000 Free Tokens (~$0.20) for every developer who signs up!')}
      icon={<Gift className='h-4 w-4 text-primary' />}
    >
      <div className='space-y-4'>
        <div className='flex gap-2'>
          <Input
            readOnly
            value={referralLink}
            className='font-mono text-xs sm:text-sm h-9 bg-muted/30'
          />
          <Button
            onClick={handleCopy}
            size='sm'
            variant='outline'
            className='h-9 px-3 gap-1.5 shrink-0'
          >
            {copied ? (
              <>
                <Check className='h-3.5 w-3.5 text-emerald-600' />
                <span className='text-xs font-semibold text-emerald-600'>{t('Copied')}</span>
              </>
            ) : (
              <>
                <Copy className='h-3.5 w-3.5' />
                <span className='text-xs font-semibold'>{t('Copy Link')}</span>
              </>
            )}
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-3 pt-2 border-t'>
          <div className='flex items-center gap-3 p-3 bg-muted/20 rounded-lg border'>
            <div className='p-2 bg-primary/10 rounded-md text-primary'>
              <Users className='h-4 w-4' />
            </div>
            <div>
              <div className='text-xs text-muted-foreground font-medium'>{t('Invited Developers')}</div>
              <div className='text-lg font-bold tabular-nums'>{profile.aff_count || 0}</div>
            </div>
          </div>

          <div className='flex items-center gap-3 p-3 bg-muted/20 rounded-lg border'>
            <div className='p-2 bg-emerald-500/10 rounded-md text-emerald-600 dark:text-emerald-400'>
              <Award className='h-4 w-4' />
            </div>
            <div>
              <div className='text-xs text-muted-foreground font-medium'>{t('Earned Tokens')}</div>
              <div className='text-lg font-bold tabular-nums'>{formatQuota(profile.aff_history_quota || 0)}</div>
            </div>
          </div>
        </div>
      </div>
    </TitledCard>
  )
}

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
import { Share2, Users, TrendingUp, BarChart3, ArrowRightLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/copy-button'
import { formatQuota } from '@/lib/format'
import type { UserWalletData } from '../types'

interface AffiliateRewardsCardProps {
  user: UserWalletData | null
  affiliateLink: string
  onTransfer: () => void
  complianceConfirmed?: boolean
  loading?: boolean
}

export function AffiliateRewardsCard({
  user,
  affiliateLink,
  onTransfer,
  complianceConfirmed = true,
  loading,
}: AffiliateRewardsCardProps) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <Card className='bg-muted/20 py-0'>
        <CardContent className='flex flex-col p-4 sm:p-5 gap-4'>
          {/* Top skeleton */}
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='mt-2 h-4 w-48' />
            </div>
            <Skeleton className='h-10 rounded-lg sm:w-72 lg:w-96' />
          </div>
          {/* Bottom skeleton */}
          <div className='border-t border-border/60 pt-4'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <div className='grid grid-cols-3 gap-4 flex-1'>
                <div className='space-y-2'>
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-6 w-24' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-6 w-24' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-6 w-24' />
                </div>
              </div>
              <Skeleton className='h-9 w-36 rounded-lg' />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='bg-muted/20 py-0'>
      <CardContent className='flex flex-col p-4 sm:p-5 gap-4'>
        {/* Top: Info & Link */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-center gap-2.5'>
            <div className='bg-background flex size-8 shrink-0 items-center justify-center rounded-lg border'>
              <Share2 className='text-muted-foreground size-4' />
            </div>
            <div className='min-w-0'>
              <h3 className='truncate text-sm font-semibold'>
                {t('Referral Program')}
              </h3>
              <p className='text-muted-foreground line-clamp-1 text-xs'>
                {t(
                  'Invite developers to join APIVEL. High-performance, unified API routing.'
                )}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 sm:w-72 lg:w-96'>
            <Input
              value={affiliateLink}
              readOnly
              className='border-muted bg-background/70 h-9 min-w-0 flex-1 font-mono text-xs'
            />
            <CopyButton
              value={affiliateLink}
              variant='outline'
              className='bg-background size-9 shrink-0'
              iconClassName='size-4'
              tooltip={t('Copy referral link')}
              aria-label={t('Copy referral link')}
            />
          </div>
        </div>

        {/* Bottom: Stats & Action */}
        <div className='border-t border-border/60 pt-4'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='grid grid-cols-3 gap-2 sm:gap-4 flex-1'>
              {/* Pending Rewards */}
              <div className='space-y-1'>
                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <TrendingUp className='h-3.5 w-3.5' />
                  <span className='truncate'>{t('Pending Rewards')}</span>
                </div>
                <div className='font-mono text-base font-bold sm:text-lg text-foreground break-all tabular-nums'>
                  {formatQuota(user?.aff_quota ?? 0)}
                </div>
              </div>

              {/* Total Earned */}
              <div className='space-y-1'>
                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <BarChart3 className='h-3.5 w-3.5' />
                  <span className='truncate'>{t('Total Earned')}</span>
                </div>
                <div className='font-mono text-base font-bold sm:text-lg text-foreground break-all tabular-nums'>
                  {formatQuota(user?.aff_history_quota ?? 0)}
                </div>
              </div>

              {/* Invited Users */}
              <div className='space-y-1'>
                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <Users className='h-3.5 w-3.5' />
                  <span className='truncate'>{t('Invited Users')}</span>
                </div>
                <div className='font-mono text-base font-bold sm:text-lg text-foreground break-all tabular-nums'>
                  {user?.aff_count ?? 0}
                </div>
              </div>
            </div>

            <div className='flex flex-col items-stretch sm:items-end justify-center gap-1.5 shrink-0'>
              <Button
                onClick={onTransfer}
                disabled={!complianceConfirmed || !user?.aff_quota || user.aff_quota <= 0}
                className='h-9 gap-1.5 px-4 font-medium'
                size='sm'
              >
                <ArrowRightLeft className='h-3.5 w-3.5' />
                {t('Transfer to Balance')}
              </Button>
              {!complianceConfirmed && (
                <span className='text-[10px] text-muted-foreground italic text-center sm:text-right'>
                  {t('Referral rewards transfer will be enabled upon account verification.')}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

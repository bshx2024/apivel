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
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatQuota, formatCompactNumber } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getUserInfo } from '../../api'
import type { UserInfo } from '../../types'

interface UserInfoDialogProps {
  userId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserInfoDialog({
  userId,
  open,
  onOpenChange,
}: UserInfoDialogProps) {
  const { t } = useTranslation()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUserInfo = useCallback(
    async (id: number) => {
      setIsLoading(true)
      try {
        const result = await getUserInfo(id)
        if (result.success) {
          setUserInfo(result.data || null)
        } else {
          toast.error(result.message || t('Failed to fetch user information'))
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user info:', error)
        toast.error(t('Failed to fetch user information'))
      } finally {
        setIsLoading(false)
      }
    },
    [t]
  )

  useEffect(() => {
    if (open && userId) {
      fetchUserInfo(userId)
    }
  }, [open, userId, fetchUserInfo])

  const InfoItem = ({
    label,
    value,
  }: {
    label: string
    value: string | number
  }) => (
    <div className='space-y-1.5'>
      <Label className='text-muted-foreground text-xs'>{label}</Label>
      <div className='text-sm font-semibold'>{value}</div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('User Information')}</DialogTitle>
          <DialogDescription>
            {t(
              'View detailed information about this user including balance, usage statistics, and invitation details.'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='text-muted-foreground size-6 animate-spin' />
          </div>
        ) : userInfo ? (
          <div className='space-y-4 py-4'>
            {/* Basic Info */}
            <div className='grid grid-cols-2 gap-4'>
              <InfoItem label={t('Username')} value={userInfo.username} />
              {userInfo.display_name && (
                <InfoItem
                  label={t('Display Name')}
                  value={userInfo.display_name}
                />
              )}
            </div>

            {/* Balance Info */}
            <div className='grid grid-cols-2 gap-4'>
              <InfoItem
                label={t('Balance')}
                value={formatQuota(userInfo.quota)}
              />
              <InfoItem
                label={t('Used Quota')}
                value={formatQuota(userInfo.used_quota)}
              />
            </div>

            {/* Statistics */}
            <div className='grid grid-cols-2 gap-4'>
              <InfoItem
                label={t('Request Count')}
                value={formatCompactNumber(userInfo.request_count)}
              />
              {userInfo.group && (
                <InfoItem label={t('User Group')} value={userInfo.group} />
              )}
            </div>

            {/* Invitation Info */}
            {(userInfo.aff_code ||
              userInfo.aff_count !== undefined ||
              (userInfo.aff_quota !== undefined && userInfo.aff_quota > 0)) && (
              <>
                <div className='grid grid-cols-2 gap-4'>
                  {userInfo.aff_code && (
                    <InfoItem
                      label={t('Invitation Code')}
                      value={userInfo.aff_code}
                    />
                  )}
                  {userInfo.aff_count !== undefined && (
                    <InfoItem
                      label={t('Invited Users')}
                      value={formatCompactNumber(userInfo.aff_count)}
                    />
                  )}
                </div>

                {userInfo.aff_quota !== undefined && userInfo.aff_quota > 0 && (
                  <InfoItem
                    label={t('Invitation Quota')}
                    value={formatQuota(userInfo.aff_quota)}
                  />
                )}
              </>
            )}

            {/* Attribution & Client Environment */}
            {(userInfo.first_source || userInfo.register_ip || userInfo.register_device) && (
              <div className='bg-muted/40 rounded-lg p-3 space-y-2 border border-border/50'>
                <div className='text-xs font-medium text-foreground/80'>
                  {t('Attribution & Environment')}
                </div>
                <div className='grid grid-cols-2 gap-3 text-xs'>
                  {userInfo.first_source && (
                    <InfoItem
                      label={t('Channel Source')}
                      value={`${userInfo.first_source}${userInfo.first_medium ? ` (${userInfo.first_medium})` : ''}`}
                    />
                  )}
                  {userInfo.first_campaign && (
                    <InfoItem
                      label={t('Campaign')}
                      value={userInfo.first_campaign}
                    />
                  )}
                  {userInfo.register_device && (
                    <InfoItem
                      label={t('Register Device')}
                      value={`${userInfo.register_device.toUpperCase()} / ${userInfo.register_os || ''} / ${userInfo.register_browser || ''}`}
                    />
                  )}
                  {userInfo.register_ip && (
                    <InfoItem
                      label={t('Register IP')}
                      value={`${userInfo.register_ip}${userInfo.register_country ? ` (${userInfo.register_country})` : ''}`}
                    />
                  )}
                  {userInfo.register_lang && (
                    <InfoItem
                      label={t('Browser Language')}
                      value={userInfo.register_lang}
                    />
                  )}
                  {userInfo.first_landing && (
                    <div className='col-span-2 space-y-1'>
                      <Label className='text-muted-foreground text-xs'>
                        {t('Landing Page')}
                      </Label>
                      <div className='text-xs text-foreground/90 break-all font-mono'>
                        {userInfo.first_landing}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remark */}
            {userInfo.remark && (
              <div className='space-y-1.5'>
                <Label className='text-muted-foreground text-xs'>
                  {t('Remark')}
                </Label>
                <div className='text-sm leading-relaxed font-semibold break-words'>
                  {userInfo.remark}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='text-muted-foreground py-8 text-center text-sm'>
            {t('No user information available')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

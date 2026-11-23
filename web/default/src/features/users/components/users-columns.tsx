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
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { formatQuota, formatTimestamp } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableColumnHeader } from '@/components/data-table'
import { GroupBadge } from '@/components/group-badge'
import { LongText } from '@/components/long-text'
import { StatusBadge, dotColorMap } from '@/components/status-badge'
import { USER_STATUSES, USER_ROLES, isUserDeleted } from '../constants'
import { type User } from '../types'
import { DataTableRowActions } from './data-table-row-actions'

function getQuotaProgressColor(percentage: number): string {
  if (percentage <= 10) return '[&_[data-slot=progress-indicator]]:bg-rose-500'
  if (percentage <= 30) return '[&_[data-slot=progress-indicator]]:bg-amber-500'
  return '[&_[data-slot=progress-indicator]]:bg-emerald-500'
}

function getCountryFlag(code?: string): string {
  if (!code || code.length !== 2 || code === '--') return ''
  const upper = code.toUpperCase()
  const offset = 127397
  try {
    return String.fromCodePoint(...[...upper].map((c) => c.charCodeAt(0) + offset))
  } catch {
    return ''
  }
}

function formatSourceTitle(source?: string, referrer?: string): string {
  if (source && source.trim()) {
    const s = source.trim().toLowerCase()
    if (s.includes('chatgpt')) return 'ChatGPT.Com'
    if (s.includes('google')) return 'Google'
    if (s.includes('bing')) return 'Bing'
    if (s.includes('twitter') || s === 'x') return 'X.com'
    if (s.includes('github')) return 'GitHub'
    if (s === 'direct') return 'Direct'
    return source.charAt(0).toUpperCase() + source.slice(1)
  }
  if (referrer && referrer.trim()) {
    try {
      const host = new URL(referrer.startsWith('http') ? referrer : `https://${referrer}`).hostname
      return host.replace(/^www\./, '')
    } catch {
      return referrer.slice(0, 16)
    }
  }
  return 'Direct'
}

function SourceCountryCell({ user }: { user: User }) {
  const { t } = useTranslation()
  const sourceName = formatSourceTitle(user.first_source, user.first_referrer)
  const isDirect = sourceName.toLowerCase() === 'direct'
  const countryCode = user.register_country ? user.register_country.toUpperCase() : ''
  const flag = getCountryFlag(countryCode)
  const landingPath = user.first_landing || user.first_referrer || ''

  return (
    <Tooltip>
      <TooltipTrigger render={<div className='flex flex-col gap-1 min-w-[140px] max-w-[210px] cursor-help' />}>
        <div className='flex items-center gap-1.5 flex-wrap'>
          {/* Source Badge */}
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border',
              isDirect
                ? 'bg-muted text-muted-foreground border-border/60'
                : 'bg-zinc-800 text-zinc-100 border-zinc-700 dark:bg-zinc-900 dark:border-zinc-700/80 shadow-xs'
            )}
          >
            {sourceName}
          </span>

          {/* Country Badge */}
          {countryCode && countryCode !== '--' ? (
            <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30'>
              {flag && <span>{flag}</span>}
              <span>{countryCode}</span>
            </span>
          ) : (
            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[11px] text-muted-foreground/60 bg-muted/40 border border-border/40'>
              --
            </span>
          )}
        </div>

        {/* Sub-text: Landing / Campaign / Referrer */}
        {landingPath && (
          <span className='text-[10px] font-mono text-muted-foreground/70 truncate max-w-[190px]' title={landingPath}>
            {landingPath}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className='space-y-1.5 text-xs max-w-xs p-3'>
        <div className='font-semibold border-b border-border/50 pb-1'>
          {t('User Attribution & Origin')}
        </div>
        <div className='grid grid-cols-[85px_1fr] gap-x-2 gap-y-1 text-[11px]'>
          <span className='text-muted-foreground'>{t('Source')}:</span>
          <span className='font-mono font-medium'>{user.first_source || 'Direct'}</span>
          {user.first_medium && (
            <>
              <span className='text-muted-foreground'>{t('Medium')}:</span>
              <span className='font-mono'>{user.first_medium}</span>
            </>
          )}
          {user.first_campaign && (
            <>
              <span className='text-muted-foreground'>{t('Campaign')}:</span>
              <span className='font-mono'>{user.first_campaign}</span>
            </>
          )}
          {user.first_referrer && (
            <>
              <span className='text-muted-foreground'>{t('Referrer')}:</span>
              <span className='font-mono break-all'>{user.first_referrer}</span>
            </>
          )}
          {user.first_landing && (
            <>
              <span className='text-muted-foreground'>{t('Landing')}:</span>
              <span className='font-mono break-all'>{user.first_landing}</span>
            </>
          )}
          <span className='text-muted-foreground'>{t('Country')}:</span>
          <span>{countryCode || t('Unknown')} {flag}</span>
          {user.register_ip && (
            <>
              <span className='text-muted-foreground'>{t('Register IP')}:</span>
              <span className='font-mono'>{user.register_ip}</span>
            </>
          )}
          {user.last_login_ip && (
            <>
              <span className='text-muted-foreground'>{t('Last Login IP')}:</span>
              <span className='font-mono'>{user.last_login_ip}</span>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function useUsersColumns(): ColumnDef<User>[] {
  const { t } = useTranslation()
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { label: t('Select') },
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='ID' />
      ),
      cell: ({ row }) => {
        return <div className='w-[60px]'>{row.getValue('id')}</div>
      },
      meta: { label: t('ID'), mobileHidden: true },
    },
    {
      accessorKey: 'username',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Username')} />
      ),
      cell: ({ row }) => {
        const username = row.getValue('username') as string
        const displayName = row.original.display_name
        const remark = row.original.remark

        return (
          <div className='flex min-w-[160px] flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <LongText className='max-w-[140px] font-medium'>
                {username}
              </LongText>
              {remark && (
                <Tooltip>
                  <TooltipTrigger
                    render={<StatusBadge variant='success' copyable={false} />}
                  >
                    <LongText className='max-w-[80px]'>{remark}</LongText>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>{remark}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {displayName && displayName !== username && (
              <LongText className='text-muted-foreground max-w-[180px] text-xs'>
                {displayName}
              </LongText>
            )}
          </div>
        )
      },
      enableHiding: false,
      meta: { label: t('Username'), mobileTitle: true },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => {
        const user = row.original
        const requestCount = user.request_count

        const statusConfig = isUserDeleted(user)
          ? USER_STATUSES.DELETED
          : USER_STATUSES[user.status as keyof typeof USER_STATUSES]

        if (!statusConfig) {
          return null
        }

        return (
          <Tooltip>
            <TooltipTrigger render={<div className='cursor-help' />}>
              <StatusBadge
                label={t(statusConfig.labelKey)}
                variant={statusConfig.variant}
                showDot={statusConfig.showDot}
                copyable={false}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-xs'>
                {t('Requests:')} {requestCount.toLocaleString()}
              </p>
            </TooltipContent>
          </Tooltip>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)))
      },
      enableSorting: false,
      meta: { label: t('Status'), mobileBadge: true },
    },
    {
      id: 'quota',
      accessorKey: 'quota',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Quota')} />
      ),
      cell: ({ row }) => {
        const user = row.original
        const used = user.used_quota
        const remaining = user.quota
        const total = used + remaining
        const percentage = total > 0 ? (remaining / total) * 100 : 0

        if (total === 0) {
          return (
            <StatusBadge
              label={t('No Quota')}
              variant='neutral'
              copyable={false}
            />
          )
        }

        return (
          <Tooltip>
            <TooltipTrigger
              render={<div className='w-[150px] cursor-help space-y-1' />}
            >
              <div className='flex justify-between text-xs'>
                <span className='font-medium tabular-nums'>
                  {formatQuota(remaining)}
                </span>
                <span className='text-muted-foreground tabular-nums'>
                  {formatQuota(total)}
                </span>
              </div>
              <Progress
                value={percentage}
                className={cn('h-1.5', getQuotaProgressColor(percentage))}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className='space-y-1 text-xs'>
                <div>
                  {t('Used:')} {formatQuota(used)}
                </div>
                <div>
                  {t('Remaining:')} {formatQuota(remaining)}
                </div>
                <div>
                  {t('Total:')} {formatQuota(total)}
                </div>
                <div>
                  {t('Percentage:')} {percentage.toFixed(1)}%
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )
      },
      meta: { label: t('Quota') },
    },
    {
      accessorKey: 'group',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Group')} />
      ),
      cell: ({ row }) => {
        const group = row.getValue('group') as string
        return <GroupBadge group={group} />
      },
      filterFn: (row, id, value) => {
        const group = String(row.getValue(id) || t('User Group')).toLowerCase()
        const searchValue = String(value).toLowerCase()
        return group.includes(searchValue)
      },
      meta: { label: t('Group') },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Role')} />
      ),
      cell: ({ row }) => {
        const roleValue = row.getValue('role') as number
        const roleConfig = USER_ROLES[roleValue as keyof typeof USER_ROLES]

        if (!roleConfig) {
          return null
        }

        return (
          <div className='flex items-center gap-x-2'>
            {roleConfig.icon && (
              <roleConfig.icon size={16} className='text-muted-foreground' />
            )}
            <span className='text-sm'>{t(roleConfig.labelKey)}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)))
      },
      enableSorting: false,
      meta: { label: t('Role') },
    },
    {
      id: 'invite_info',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Invite Info')} />
      ),
      cell: ({ row }) => {
        const user = row.original
        const affCount = user.aff_count || 0
        const affHistoryQuota = user.aff_history_quota || 0
        const inviterId = user.inviter_id || 0

        return (
          <div className='flex items-center gap-1.5 text-xs font-medium'>
            <span
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                dotColorMap.neutral
              )}
              aria-hidden='true'
            />
            <Tooltip>
              <TooltipTrigger
                render={<span className='text-muted-foreground cursor-help' />}
              >
                {t('Invited')}: {affCount}
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>{t('Number of users invited')}</p>
              </TooltipContent>
            </Tooltip>
            <span className='text-muted-foreground/30'>·</span>
            <Tooltip>
              <TooltipTrigger
                render={<span className='text-muted-foreground cursor-help' />}
              >
                {t('Revenue')}: {formatQuota(affHistoryQuota)}
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>{t('Total invitation revenue')}</p>
              </TooltipContent>
            </Tooltip>
            {inviterId > 0 && (
              <>
                <span className='text-muted-foreground/30'>·</span>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className='text-muted-foreground cursor-help' />
                    }
                  >
                    {t('Inviter')}: {inviterId}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>
                      {t('Invited by user ID')} {inviterId}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {inviterId === 0 && (
              <>
                <span className='text-muted-foreground/30'>·</span>
                <span className='text-muted-foreground'>{t('No Inviter')}</span>
              </>
            )}
          </div>
        )
      },
      enableSorting: false,
      meta: { label: t('Invite Info'), mobileHidden: true },
    },
    {
      id: 'source_country',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Source / Country')} />
      ),
      cell: ({ row }) => <SourceCountryCell user={row.original} />,
      enableSorting: false,
      meta: { label: t('Source / Country') },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created At')} />
      ),
      cell: ({ row }) => {
        const ts = row.getValue('created_at') as number | undefined
        return (
          <span className='text-muted-foreground text-sm'>
            {ts ? formatTimestamp(ts) : '-'}
          </span>
        )
      },
      meta: { label: t('Created At'), mobileHidden: true },
    },
    {
      accessorKey: 'last_login_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last Login')} />
      ),
      cell: ({ row }) => {
        const ts = row.getValue('last_login_at') as number | undefined
        const ip = row.original.last_login_ip || row.original.register_ip
        return (
          <div className='flex flex-col text-xs'>
            <span className='text-muted-foreground'>
              {ts ? formatTimestamp(ts) : '-'}
            </span>
            {ip && (
              <span className='font-mono text-[11px] text-muted-foreground/75' title={t('IP Address')}>
                {ip}
              </span>
            )}
          </div>
        )
      },
      meta: { label: t('Last Login'), mobileHidden: true },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />,
      meta: { label: t('Actions') },
    },
  ]
}

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
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useSourceMapping } from '@/lib/source-model-mapping'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  CreditCard,
  FileText,
  KeyRound,
  ListChecks,
  Play,
  RadioTower,
  ShieldCheck,
  Terminal,
  TerminalSquare,
  Timer,
  Activity,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { IconGithub } from '@/assets/brand-icons'
import { getUserModels } from '@/lib/api'
import { MOTION_TRANSITION } from '@/lib/motion'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/copy-button'
import {
  CardStaggerContainer,
  CardStaggerItem,
} from '@/components/page-transition'
import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { useApiInfo } from '../../hooks/use-status-data'
import { AnnouncementsPanel } from './announcements-panel'
import { ApiInfoPanel } from './api-info-panel'
import { FAQPanel } from './faq-panel'
import { PerformanceHealthPanel } from './performance-health-panel'
import { SummaryCards } from './summary-cards'
import { UptimePanel } from './uptime-panel'
import { InstantTestCard } from './instant-test-card'

const SETUP_GUIDE_VISIBILITY_STORAGE_KEY =
  'dashboard_overview_setup_guide_expanded'

const SETUP_GUIDE_CODE_PATTERN = [
  'const request = await client.responses.create({',
  "  model: 'deepseek-v4-flash',",
  "  input: 'Start routing traffic',",
  '})',
  '',
  'if (request.output_text) {',
  '  console.log(request.output_text)',
  '}',
].join('\n')

type DashboardActionPath =
  | '/keys'
  | '/wallet'
  | '/playground'
  | '/channels'
  | '/usage-logs'
  | '/pricing'

interface StartStep {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  completed: boolean
}

interface QuickAction {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  adminOnly?: boolean
}

interface RequestExample {
  endpoint: string
  baseUrl: string
  model: string
  keyName: string
  displayKey: string
  rawApiKey?: string
  curl: string
  claudeCode: string
  ready: boolean
}

interface HeroSignal {
  label: string
  value: string
  icon: LucideIcon
}

function getSavedSetupGuideExpanded(): boolean | null {
  if (typeof window === 'undefined') return null
  const saved = window.localStorage.getItem(SETUP_GUIDE_VISIBILITY_STORAGE_KEY)
  if (saved === 'expanded') return true
  if (saved === 'collapsed') return false
  return null
}

function saveSetupGuideExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SETUP_GUIDE_VISIBILITY_STORAGE_KEY,
    expanded ? 'expanded' : 'collapsed'
  )
}

function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function normalizeEndpoint(sourceUrl?: string): string {
  const fallback = `${getCurrentOrigin()}/v1/chat/completions`
  const trimmed = sourceUrl?.trim()
  if (!trimmed) return fallback

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  if (withoutTrailingSlash.endsWith('/v1/chat/completions')) {
    return withoutTrailingSlash
  }
  if (withoutTrailingSlash.endsWith('/v1')) {
    return `${withoutTrailingSlash}/chat/completions`
  }
  return `${withoutTrailingSlash}/v1/chat/completions`
}

function getPreferredKey(keys: ApiKey[]): ApiKey | null {
  return keys.find((item) => item.status === 1) ?? keys[0] ?? null
}

function formatDisplayKey(key?: string): string {
  if (!key) return 'sk-...'
  if (key.length <= 14) return key
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

function buildCurlCommand(args: {
  endpoint: string
  apiKey: string
  model: string
}): string {
  return [
    `curl ${args.endpoint} \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${args.apiKey}" \\`,
    `  -d '{"model":"${args.model}","messages":[{"role":"user","content":"Say hello in one sentence."}]}'`,
  ].join('\n')
}

function buildClaudeCodeCommand(args: {
  baseUrl: string
  apiKey: string
}): string {
  return [
    `export ANTHROPIC_BASE_URL="${args.baseUrl}"`,
    `export ANTHROPIC_API_KEY="${args.apiKey}"`,
    'claude',
  ].join('\n')
}

function SetupGuideBackdrop(props: { compact?: boolean }) {
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,oklch(0.97_0.04_250/.92)_0%,oklch(0.95_0.08_315/.82)_38%,oklch(0.96_0.12_92/.78)_74%,oklch(0.94_0.1_132/.62)_100%)] dark:opacity-25',
          props.compact
            ? '[mask-image:linear-gradient(90deg,black_0%,black_48%,transparent_74%)] opacity-55'
            : 'opacity-85'
        )}
        aria-hidden='true'
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 hidden overflow-hidden font-mono text-lime-100/75 sm:block dark:text-lime-200/25',
          props.compact ? 'w-1/2 opacity-45' : 'w-[58%] opacity-75'
        )}
        aria-hidden='true'
      >
        <pre
          className={cn(
            'absolute right-3 [mask-image:linear-gradient(90deg,transparent_0%,black_30%,black_82%,transparent_100%)] text-right tracking-[0.38em] whitespace-pre',
            props.compact
              ? '-top-6 text-[9px] leading-4'
              : 'top-1 text-[11px] leading-5'
          )}
        >
          {SETUP_GUIDE_CODE_PATTERN}
        </pre>
      </div>
      <div
        className='from-background/35 to-background/70 dark:from-background/20 dark:to-background/80 pointer-events-none absolute inset-0 bg-linear-to-b via-transparent'
        aria-hidden='true'
      />
    </>
  )
}

function StartStepItem(props: {
  step: StartStep
  index: number
  isLast: boolean
}) {
  const Icon = props.step.icon
  const StatusIcon = props.step.completed ? Check : Circle

  return (
    <li className='relative flex gap-3 pb-2.5 last:pb-0'>
      {!props.isLast && (
        <span
          className='bg-border absolute top-9 bottom-0 left-4 w-px'
          aria-hidden='true'
        />
      )}
      <span
        className={cn(
          'bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-xs',
          props.step.completed && 'border-success/30 bg-success/10'
        )}
      >
        <StatusIcon
          className={props.step.completed ? 'text-success size-4' : 'size-4'}
          aria-hidden='true'
        />
      </span>

      <Link
        to={props.step.to}
        className='bg-background/70 hover:bg-muted/50 focus-visible:ring-ring flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left shadow-xs transition-colors outline-none focus-visible:ring-2'
      >
        <span className='flex min-w-0 items-start gap-2.5'>
          <span className='bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg'>
            <Icon className='size-3.5' aria-hidden='true' />
          </span>
          <span className='flex min-w-0 flex-col gap-0.5'>
            <span className='flex items-center gap-2 text-sm font-medium'>
              <span className='text-muted-foreground font-mono text-xs tabular-nums'>
                {props.index + 1}.
              </span>
              <span className='truncate'>{props.step.title}</span>
            </span>
            <span className='text-muted-foreground line-clamp-1 text-xs'>
              {props.step.description}
            </span>
          </span>
        </span>
        <ArrowRight
          className='text-muted-foreground size-4 shrink-0'
          aria-hidden='true'
        />
      </Link>
    </li>
  )
}

function RequestPreview(props: {
  example: RequestExample
  signals: HeroSignal[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sourceContext = useSourceMapping()
  const shouldReduceMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState<'claude' | 'curl'>(() => {
    return sourceContext.preferredTab === 'claude' ? 'claude' : 'claude'
  })
  const [pingResult, setPingResult] = useState<{ ok: boolean; latency: number } | null>(null)
  const [isPinging, setIsPinging] = useState(false)

  const handlePing = async () => {
    setIsPinging(true)
    const start = performance.now()
    try {
      const res = await fetch('/v1', { method: 'GET' })
      const rtt = Math.round(performance.now() - start)
      setPingResult({ ok: res.ok, latency: rtt })
    } catch {
      const rtt = Math.round(performance.now() - start)
      setPingResult({ ok: false, latency: rtt })
    } finally {
      setIsPinging(false)
    }
  }

  const previewCurlLines = props.example.curl.split('\n').map((line) => {
    if (line.includes('Authorization: Bearer')) {
      return `  -H "Authorization: Bearer ${props.example.displayKey}" \\`
    }
    return line
  })

  const previewClaudeLines = [
    `export ANTHROPIC_BASE_URL="${props.example.baseUrl}"`,
    `export ANTHROPIC_API_KEY="${props.example.displayKey}"`,
    'claude',
  ]

  const activeLines = activeTab === 'claude' ? previewClaudeLines : previewCurlLines
  const activeCopyValue =
    activeTab === 'claude'
      ? `export ANTHROPIC_BASE_URL="${props.example.baseUrl}" && export ANTHROPIC_API_KEY="${props.example.rawApiKey || 'sk-...'}" && claude`
      : props.example.curl

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={MOTION_TRANSITION.slow}
      className='bg-background/75 relative overflow-hidden rounded-2xl border p-3 shadow-sm backdrop-blur'
    >
      {!shouldReduceMotion && (
        <motion.div
          className='via-foreground/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent'
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden='true'
        />
      )}

      <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg text-primary'>
            <Terminal className='size-4' aria-hidden='true' />
          </span>
          <div className='min-w-0'>
            <div className='truncate text-sm font-medium flex items-center gap-1.5'>
              <span>{t('Instant Integration')}</span>
              {activeTab === 'claude' && (
                <Badge variant='outline' className='border-primary/40 bg-primary/10 text-primary text-[10px] py-0 px-1.5 font-medium'>
                  ⚡ Claude Code
                </Badge>
              )}
              {sourceContext.matched && (
                <Badge variant='outline' className='border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] py-0 px-1.5 font-medium'>
                  ✨ {t(sourceContext.badgeLabel)}
                </Badge>
              )}
            </div>
            <div className='text-muted-foreground truncate text-xs'>
              {props.example.ready
                ? props.example.keyName
                : t('Create an API key to unlock the real request')}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* CLI / cURL Tab Switcher */}
          <div className='flex items-center gap-1 rounded-lg bg-muted/60 p-0.5 border border-border/50'>
            <button
              type='button'
              onClick={() => setActiveTab('claude')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'claude'
                  ? 'bg-background text-primary font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Terminal className='size-3 text-primary' />
              <span>Claude Code</span>
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('curl')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'curl'
                  ? 'bg-background text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>cURL</span>
            </button>
          </div>

          {props.example.ready ? (
            <CopyButton
              value={activeCopyValue}
              variant='outline'
              size='sm'
              className='h-7 gap-1.5 px-2 text-xs'
              tooltip={
                activeTab === 'claude'
                  ? t('Copy Claude Code CLI command')
                  : t('Copy ready-to-run curl')
              }
              successTooltip={t('Copied!')}
              aria-label={t('Copy integration code')}
              onCopy={() => {
                toast.success(
                  activeTab === 'claude'
                    ? t('Claude Code CLI command copied!')
                    : t('Integration code copied!'),
                  {
                    action: {
                      label: t('Test in Playground →'),
                      onClick: () => {
                        navigate({
                          to: '/playground',
                          search: { model: props.example.model },
                        })
                      },
                    },
                  }
                )
              }}
            >
              {t('Copy')}
            </CopyButton>
          ) : (
            <Button size='sm' variant='outline' render={<Link to='/keys' />}>
              {t('Create API Key')}
            </Button>
          )}
        </div>
      </div>

      <div className='bg-foreground/[0.035] my-3 rounded-xl p-3 font-mono text-xs'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-1.5'>
            <span className='bg-destructive size-2 rounded-full' />
            <span className='bg-warning size-2 rounded-full' />
            <span className='bg-success size-2 rounded-full' />
          </div>
          <span className='text-[10px] text-muted-foreground font-mono'>
            {activeTab === 'claude' ? 'Terminal (CLI Agent)' : 'Bash / cURL'}
          </span>
        </div>
        <div className='flex flex-col gap-1 overflow-hidden'>
          {activeLines.map((line, index) => (
            <code
              key={`${line}-${index}`}
              className='text-muted-foreground truncate'
              title={line}
            >
              {line}
            </code>
          ))}
        </div>
      </div>

      <div className='grid gap-2'>
        {props.signals.map((signal) => {
          const Icon = signal.icon

          return (
            <div
              key={signal.label}
              className='bg-muted/40 flex items-center justify-between gap-3 rounded-xl px-3 py-2'
            >
              <span className='flex min-w-0 items-center gap-2'>
                <Icon
                  className='text-muted-foreground size-3.5 shrink-0'
                  aria-hidden='true'
                />
                <span className='truncate text-xs font-medium'>
                  {signal.label}
                </span>
              </span>
              <span className='text-muted-foreground shrink-0 text-xs'>
                {signal.value}
              </span>
            </div>
          )
        })}

        {/* 连通性测试 (Ping API) */}
        <div className='flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5 text-xs'>
          <div className='flex items-center gap-1.5'>
            <Activity className='size-3 text-muted-foreground' />
            <span className='font-medium text-muted-foreground'>{t('API 连通性:', 'API 连通性:')}</span>
            {pingResult ? (
              pingResult.ok ? (
                <span className='text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-1'>
                  <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                  <span>{pingResult.latency}ms ({t('畅通', '畅通')})</span>
                </span>
              ) : (
                <span className='text-destructive font-semibold font-mono'>{t('异常', '异常')} ({pingResult.latency}ms)</span>
              )
            ) : (
              <span className='text-muted-foreground text-[11px]'>{t('未测试', '未测试')}</span>
            )}
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={handlePing}
            disabled={isPinging}
            className='h-6 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 cursor-pointer'
          >
            {isPinging ? 'Ping...' : t('⚡ 测试连通性', '⚡ 测试连通性')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function QuickActionItem(props: { action: QuickAction }) {
  const Icon = props.action.icon

  return (
    <Button
      variant='outline'
      className='h-auto justify-start rounded-xl px-3 py-3 text-left'
      render={<Link to={props.action.to} />}
    >
      <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg'>
        <Icon className='size-4' aria-hidden='true' />
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate text-sm font-medium'>
          {props.action.title}
        </span>
        <span className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
          {props.action.description}
        </span>
      </span>
    </Button>
  )
}

function CompactQuickAction(props: { action: QuickAction }) {
  const Icon = props.action.icon

  return (
    <Button
      variant='outline'
      size='sm'
      className='bg-background/70 h-8 min-w-24 gap-1.5 px-2.5'
      render={<Link to={props.action.to} />}
    >
      <Icon data-icon='inline-start' />
      <span>{props.action.title}</span>
    </Button>
  )
}

export function OverviewDashboard() {
  const { t } = useTranslation()
  const sourceContext = useSourceMapping()
  const user = useAuthStore((state) => state.auth.user)
  const { items: apiInfoItems } = useApiInfo()
  const [manualSetupGuideExpanded, setManualSetupGuideExpanded] = useState<
    boolean | null
  >(() => getSavedSetupGuideExpanded())

  const requestCount = Number(user?.request_count ?? 0)
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)

  const apiKeysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-keys'],
    queryFn: async () => {
      const result = await getApiKeys({ p: 1, size: 10 })
      return result.success ? (result.data?.items ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  const modelsQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'user-models'],
    queryFn: async () => {
      const result = await getUserModels()
      return result.success ? (result.data ?? []) : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const preferredKey = useMemo(
    () => getPreferredKey(apiKeysQuery.data ?? []),
    [apiKeysQuery.data]
  )

  const realKeyQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'token-key', preferredKey?.id],
    queryFn: async () => {
      if (!preferredKey?.id) return ''
      const result = await fetchTokenKey(preferredKey.id)
      return result.success && result.data?.key ? `sk-${result.data.key}` : ''
    },
    enabled: Boolean(preferredKey?.id),
    staleTime: 5 * 60 * 1000,
  })

  const isTrialUser = requestCount === 0 && remainQuota >= 100000

  const startSteps = useMemo<StartStep[]>(
    () => [
      {
        title: t('Create API Key'),
        description: t('Create a key for your app or service'),
        to: '/keys',
        icon: KeyRound,
        completed: Boolean(preferredKey),
      },
      isTrialUser
        ? {
            title: t('Try Playground (Free Trial Active)'),
            description: t('Test models directly in browser — zero top-up needed'),
            to: '/playground',
            icon: Play,
            completed: requestCount > 0,
          }
        : {
            title: t('Add credits'),
            description: t('Keep enough balance before production traffic'),
            to: '/wallet',
            icon: CreditCard,
            completed: remainQuota > 0 || usedQuota > 0,
          },
      isTrialUser
        ? {
            title: t('Client Integration'),
            description: t('Connect Cursor, Claude Code CLI, or OpenAI SDK'),
            to: '/keys',
            icon: TerminalSquare,
            completed: Boolean(preferredKey && requestCount > 0),
          }
        : {
            title: t('Send a request'),
            description: t('Verify routing with Playground or your client'),
            to: '/playground',
            icon: TerminalSquare,
            completed: requestCount > 0,
          },
    ],
    [isTrialUser, preferredKey, remainQuota, requestCount, t, usedQuota]
  )

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        title: t('Playground'),
        description: t('Test models and prompts from the browser'),
        to: '/playground',
        icon: Play,
      },
      {
        title: t('Channels'),
        description: t('Configure upstream providers and routing.'),
        to: '/channels',
        icon: RadioTower,
        adminOnly: true,
      },
      {
        title: t('Usage Logs'),
        description: t('Inspect requests, errors, and billing details'),
        to: '/usage-logs',
        icon: FileText,
      },
      {
        title: t('Pricing'),
        description: t('Review model rates before scaling traffic'),
        to: '/pricing',
        icon: BookOpen,
      },
    ],
    [t]
  )

  const visibleQuickActions = useMemo(
    () => quickActions.filter((action) => !action.adminOnly || isAdmin),
    [isAdmin, quickActions]
  )

  const heroSignals = useMemo<HeroSignal[]>(
    () => [
      {
        label: t('Route active'),
        value: apiInfoItems.length > 0 ? t('Online') : t('Current domain'),
        icon: RadioTower,
      },
      {
        label: t('Auth configured'),
        value: preferredKey ? t('Secured') : t('Needs API key'),
        icon: ShieldCheck,
      },
      {
        label: t('Model selected'),
        value: modelsQuery.data?.[0] ?? t('Loading'),
        icon: Timer,
      },
    ],
    [apiInfoItems.length, modelsQuery.data, preferredKey, t]
  )

  const requestExample = useMemo<RequestExample>(() => {
    const endpoint = normalizeEndpoint(apiInfoItems[0]?.url)
    const baseUrl = endpoint.replace(/\/chat\/completions$/, '')
    const matchedModel =
      sourceContext.matched && sourceContext.recommendedModel
        ? modelsQuery.data?.includes(sourceContext.recommendedModel)
          ? sourceContext.recommendedModel
          : null
        : null
    const model =
      matchedModel ??
      modelsQuery.data?.[0] ??
      sourceContext.recommendedModel ??
      'deepseek-v4-flash'
    const apiKey = realKeyQuery.data ?? ''
    const keyName = preferredKey?.name ?? t('No API key yet')
    const ready = Boolean(apiKey && model)

    return {
      endpoint,
      baseUrl,
      model,
      keyName,
      displayKey: formatDisplayKey(apiKey),
      rawApiKey: apiKey || '',
      ready,
      curl: buildCurlCommand({
        endpoint,
        apiKey: apiKey || 'sk-...',
        model,
      }),
      claudeCode: buildClaudeCodeCommand({
        baseUrl,
        apiKey: apiKey || 'sk-...',
      }),
    }
  }, [apiInfoItems, modelsQuery.data, preferredKey, realKeyQuery.data, sourceContext, t])

  const completedStepCount = startSteps.filter((step) => step.completed).length
  const setupComplete = completedStepCount === startSteps.length
  const setupGuideExpanded = manualSetupGuideExpanded ?? !setupComplete

  const handleSetupGuideToggle = () => {
    const nextExpanded = !setupGuideExpanded
    setManualSetupGuideExpanded(nextExpanded)
    saveSetupGuideExpanded(nextExpanded)
  }

  const hasCompletedSurvey =
    typeof window !== 'undefined' &&
    localStorage.getItem('apivel_onboarding_survey_done') === 'true'

  return (
    <div className='flex flex-col gap-4'>
      {!hasCompletedSurvey && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background border border-amber-500/30 rounded-2xl shadow-xs backdrop-blur-xs'>
          <div className='flex items-center gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'>
              <Zap className='size-5' />
            </span>
            <div>
              <div className='flex items-center gap-2'>
                <h4 className='text-sm font-semibold text-foreground'>
                  {t('onboarding_nudge_title', '⚡ Unlock Welcome Privilege: First Deposit $4.99 Gets +50% Extra Credits')}
                </h4>
                <Badge variant='outline' className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-1.5 font-medium'>
                  {t('Limited Welcome Perk', '限时新人特权')}
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {t('onboarding_nudge_desc', 'Free $0.20 test credit already in balance. Share your model preferences in 15s to claim the $4.99 Starter Pack with 20M+ DeepSeek tokens!')}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2 shrink-0 self-end sm:self-auto'>
            <Button
              size='sm'
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('apivale:open-quickstart'))
                }
              }}
              className='bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 font-medium cursor-pointer shadow-xs gap-1.5'
            >
              <span>{t('Claim Privilege →', '立即解锁特权 →')}</span>
            </Button>
          </div>
        </div>
      )}
      {!user?.github_id && (user?.quota ?? 0) <= 100000 && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl shadow-xs backdrop-blur-xs'>
          <div className='flex items-center gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400'>
              <IconGithub className='size-5' />
            </span>
            <div>
              <h4 className='text-sm font-semibold text-emerald-800 dark:text-emerald-200'>
                {t('bind_github_bonus_title', '🎁 体验额度不足？立即绑定 GitHub 立享 $0.20 免费额度！')}
              </h4>
              <p className='text-xs text-emerald-600 dark:text-emerald-400 mt-0.5'>
                {t('bind_github_bonus_desc', '您当前额度不足且尚未绑定 GitHub。立即绑定账号，即可立得 $0.20 (100,000) 免费测试额度，立即调试 10-20 次 API 接口！')}
              </p>
            </div>
          </div>
          <Button size='sm' className='shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700' render={<Link to='/profile' />}>
            {t('bind_now', '立即绑定')}
            <ArrowRight className='size-4 ml-1' />
          </Button>
        </div>
      )}
      {setupGuideExpanded ? (
        <CardStaggerContainer className='grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]'>
          <CardStaggerItem className='bg-card h-full overflow-hidden rounded-2xl border shadow-xs'>
            <div className='relative h-full overflow-hidden p-4 sm:p-5'>
              <SetupGuideBackdrop />
              <div className='relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]'>
                <div className='flex min-w-0 flex-col gap-5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='flex max-w-2xl flex-col gap-1'>
                      <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase'>
                        <ListChecks className='size-3.5' aria-hidden='true' />
                        {t('Get started')}
                      </div>
                      <h3 className='text-xl font-semibold tracking-tight sm:text-2xl'>
                        {t('Build on your API gateway in minutes')}
                      </h3>
                      <p className='text-muted-foreground max-w-xl text-sm leading-relaxed'>
                        {t(
                          'A focused home for keys, balance, routing, and service health.'
                        )}
                      </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleSetupGuideToggle}
                      >
                        <ChevronUp data-icon='inline-start' />
                        {t('Hide setup guide')}
                      </Button>
                      <Button size='sm' render={<Link to='/keys' />}>
                        <KeyRound data-icon='inline-start' />
                        {t('Create API Key')}
                      </Button>
                    </div>
                  </div>

                  <ol className='bg-background/45 rounded-2xl border p-2 backdrop-blur'>
                    {startSteps.map((step, index) => (
                      <StartStepItem
                        key={step.title}
                        step={step}
                        index={index}
                        isLast={index === startSteps.length - 1}
                      />
                    ))}
                  </ol>
                </div>

                <RequestPreview
                  example={requestExample}
                  signals={heroSignals}
                />
              </div>
            </div>
          </CardStaggerItem>

          <CardStaggerItem className='bg-card h-full rounded-2xl border p-4 shadow-xs sm:p-5'>
            <div className='flex h-full flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  {t('Recommended actions')}
                </div>
                <h3 className='text-lg font-semibold tracking-tight'>
                  {t('Keep the platform ready')}
                </h3>
              </div>
              <div className='grid gap-2'>
                {visibleQuickActions.map((action) => (
                  <QuickActionItem key={action.title} action={action} />
                ))}
              </div>
            </div>
          </CardStaggerItem>
        </CardStaggerContainer>
      ) : (
        <CardStaggerContainer>
          <CardStaggerItem className='bg-card overflow-hidden rounded-2xl border shadow-xs'>
            <div className='relative overflow-hidden px-4 py-3 sm:px-5'>
              <SetupGuideBackdrop compact />
              <div className='relative flex flex-wrap items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='bg-background/70 flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-xs'>
                    <Check className='text-success size-4' aria-hidden='true' />
                  </span>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='truncate text-sm font-semibold'>
                        {setupComplete
                          ? t('Setup guide complete')
                          : t('Setup guide')}
                      </h3>
                      <span className='text-muted-foreground bg-background/60 rounded-md border px-2 py-0.5 text-xs'>
                        {t('Setup progress: {{completed}}/{{total}}', {
                          completed: completedStepCount,
                          total: startSteps.length,
                        })}
                      </span>
                    </div>
                    <p className='text-muted-foreground line-clamp-1 text-xs'>
                      {setupComplete
                        ? t(
                            'Your setup guide is collapsed so usage stays in focus.'
                          )
                        : t('Setup guide is collapsed. Expand it anytime.')}
                    </p>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  {visibleQuickActions.map((action) => (
                    <CompactQuickAction key={action.title} action={action} />
                  ))}
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-background/70 h-8 min-w-28'
                    onClick={handleSetupGuideToggle}
                  >
                    <ChevronDown data-icon='inline-start' />
                    {t('Show setup guide')}
                  </Button>
                </div>
              </div>
            </div>
          </CardStaggerItem>
        </CardStaggerContainer>
      )}

      {/* ⚡ 10秒极速在线测试组件 (免配置即测，解决新用户测试冷启动门槛) */}
      <InstantTestCard
        apiKey={requestExample.rawApiKey}
        baseUrl={requestExample.baseUrl}
        userEmail={user?.email}
      />

      <SummaryCards />

      <CardStaggerContainer className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]'>
        <div className='grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2'>
          {isAdmin && (
            <CardStaggerItem className='lg:col-span-2'>
              <PerformanceHealthPanel />
            </CardStaggerItem>
          )}
          <CardStaggerItem>
            <ApiInfoPanel />
          </CardStaggerItem>
          <CardStaggerItem>
            <AnnouncementsPanel />
          </CardStaggerItem>
          <CardStaggerItem>
            <FAQPanel />
          </CardStaggerItem>
        </div>
        <CardStaggerItem>
          <UptimePanel />
        </CardStaggerItem>
      </CardStaggerContainer>
    </div>
  )
}

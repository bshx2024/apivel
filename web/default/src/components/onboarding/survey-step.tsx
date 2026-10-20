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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Compass,
  Briefcase,
  Cpu,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Gift,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { track } from '@/lib/tracker'

export interface SurveyData {
  source: string
  useCase: string
  models: string[]
  budget: string
}

interface SurveyStepProps {
  onComplete: (data: SurveyData) => void
  onSkip: () => void
}

export function SurveyStep({ onComplete, onSkip }: SurveyStepProps) {
  const { t } = useTranslation()

  const [source, setSource] = useState<string>('Search')
  const [useCase, setUseCase] = useState<string>('Indie')
  const [models, setModels] = useState<string[]>(['deepseek', 'qwen'])
  const [budget, setBudget] = useState<string>('under_20')

  const SOURCE_OPTIONS = [
    { id: 'Search', label: t('Google / Search Engine'), icon: '🔍' },
    { id: 'Social', label: t('X (Twitter) / Social Media'), icon: '🌐' },
    { id: 'Referral', label: t('Colleague / Friend Referral'), icon: '👥' },
    { id: 'Community', label: t('Developer Community (Reddit, GitHub, etc.)'), icon: '💬' },
    { id: 'Blog', label: t('Tech Blog / Tutorial'), icon: '📝' },
    { id: 'Other', label: t('Other'), icon: '✨' },
  ]

  const USE_CASE_OPTIONS = [
    {
      id: 'Production',
      title: t('Commercial & Production API'),
      desc: t('Production workloads, customer-facing applications'),
    },
    {
      id: 'Indie',
      title: t('Solo / Indie Hacker Project'),
      desc: t('SaaS products, bots, micro-services'),
    },
    {
      id: 'Tools',
      title: t('AI Coding & Assistant Tools'),
      desc: t('Cursor, Cline, NextChat, Cherry Studio'),
    },
    {
      id: 'Research',
      title: t('Research & Evaluation'),
      desc: t('Benchmarking, prompt testing, academic use'),
    },
  ]

  const MODEL_OPTIONS = [
    {
      id: 'deepseek',
      name: 'DeepSeek Series',
      desc: 'v4-flash / reasoner / v3',
      badge: 'Wholesale Price',
    },
    {
      id: 'qwen',
      name: 'Qwen Series',
      desc: '3.8-flash / max',
      badge: 'Alibaba Flagship',
    },
    {
      id: 'glm',
      name: 'GLM Series',
      desc: '5.3-flash / 5.3',
      badge: 'Zhipu AI Agentic',
    },
    {
      id: 'seedance',
      name: 'Doubao Seedance',
      desc: '2.0-mini / 2.5',
      badge: 'Next-Gen Video',
    },
  ]

  const BUDGET_OPTIONS = [
    { id: 'under_20', label: '< $20 / mo', sub: t('Starter / Light Testing') },
    { id: '20_100', label: '$20 - $100 / mo', sub: t('Growing Project') },
    { id: '100_500', label: '$100 - $500 / mo', sub: t('Production Scale') },
    { id: 'over_500', label: '$500+ / mo', sub: t('High-Volume Enterprise') },
  ]

  const toggleModel = (id: string) => {
    setModels((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((m) => m !== id)
          : prev
        : [...prev, id]
    )
  }

  const handleSubmit = () => {
    const data: SurveyData = { source, useCase, models, budget }
    track('onboarding_survey_submitted', {
      source,
      use_case: useCase,
      models: models.join(','),
      budget,
    })
    try {
      localStorage.setItem('apivel_user_persona', JSON.stringify(data))
      localStorage.setItem('apivel_onboarding_survey_done', 'true')
    } catch {
      /* ignore */
    }
    onComplete(data)
  }

  return (
    <div className='flex flex-col h-full max-h-[80vh] overflow-y-auto px-6 py-5 space-y-6'>
      {/* Step Indicator Header */}
      <div className='flex items-center justify-between pb-3 border-b border-border/50'>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='bg-primary/10 text-primary border-primary/30 font-semibold px-2.5 py-0.5 text-xs'>
            <Sparkles className='h-3 w-3 mr-1 inline' />
            {t('Step 1 of 2 · Developer Setup')}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            {t('Takes ~30 seconds')}
          </span>
        </div>
        <button
          onClick={onSkip}
          className='text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
        >
          {t('Skip for now')}
        </button>
      </div>

      {/* Intro Title */}
      <div className='space-y-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='secondary' className='gap-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-2 py-0.5'>
            <Gift className='h-3 w-3' />
            {t('Free $0.20 Trial Credits Delivered')}
          </Badge>
          <Badge variant='outline' className='gap-1 text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 px-2 py-0.5'>
            <Zap className='h-3 w-3' />
            {t('15s Setup Unlocks: $4.99 Pack (+50% Bonus · 20M+ Tokens)')}
          </Badge>
        </div>
        <h3 className='text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2'>
          ⚡ {t('Configure Your Developer Workspace')}
        </h3>
        <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
          {t('Help us customize your low-latency routing nodes, concurrency limits, and dedicated models.')}
        </p>
      </div>

      {/* Question 1: Source */}
      <div className='space-y-2.5'>
        <label className='text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5'>
          <Compass className='h-3.5 w-3.5 text-primary' />
          1. {t('Where did you hear about APIVEL?')}
        </label>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
          {SOURCE_OPTIONS.map((opt) => {
            const isSelected = source === opt.id
            return (
              <button
                key={opt.id}
                type='button'
                onClick={() => setSource(opt.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs ring-1 ring-primary/30'
                    : 'border-border/60 hover:border-border hover:bg-muted/40 text-foreground'
                }`}
              >
                <span className='text-sm'>{opt.icon}</span>
                <span className='truncate'>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Question 2: Primary Use Case */}
      <div className='space-y-2.5'>
        <label className='text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5'>
          <Briefcase className='h-3.5 w-3.5 text-primary' />
          2. {t('What is your primary use case?')}
        </label>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {USE_CASE_OPTIONS.map((opt) => {
            const isSelected = useCase === opt.id
            return (
              <button
                key={opt.id}
                type='button'
                onClick={() => setUseCase(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                    : 'border-border/60 hover:border-border hover:bg-muted/40'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {opt.title}
                  </span>
                  {isSelected && <CheckCircle2 className='h-3.5 w-3.5 text-primary shrink-0' />}
                </div>
                <p className='text-[11px] text-muted-foreground mt-0.5 line-clamp-1'>
                  {opt.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Question 3: Models of Interest */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between'>
          <label className='text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5'>
            <Cpu className='h-3.5 w-3.5 text-primary' />
            3. {t('Which model series are you most interested in?')}
          </label>
          <span className='text-[11px] text-muted-foreground'>({t('Multiple selection')})</span>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
          {MODEL_OPTIONS.map((opt) => {
            const isSelected = models.includes(opt.id)
            return (
              <button
                key={opt.id}
                type='button'
                onClick={() => toggleModel(opt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                    : 'border-border/60 hover:border-border hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className='flex items-center justify-between'>
                    <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {opt.name}
                    </span>
                    {isSelected && <CheckCircle2 className='h-3 w-3 text-primary shrink-0' />}
                  </div>
                  <p className='text-[10px] text-muted-foreground mt-0.5 font-mono'>
                    {opt.desc}
                  </p>
                </div>
                <span className='inline-block mt-2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded'>
                  {opt.badge}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Question 4: Monthly Budget */}
      <div className='space-y-2.5'>
        <label className='text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5'>
          <DollarSign className='h-3.5 w-3.5 text-primary' />
          4. {t('Estimated monthly API budget?')}
        </label>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
          {BUDGET_OPTIONS.map((opt) => {
            const isSelected = budget === opt.id
            return (
              <button
                key={opt.id}
                type='button'
                onClick={() => setBudget(opt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                    : 'border-border/60 hover:border-border hover:bg-muted/40'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {opt.label}
                  </span>
                  {isSelected && <CheckCircle2 className='h-3 w-3 text-primary shrink-0' />}
                </div>
                <p className='text-[10px] text-muted-foreground mt-0.5'>
                  {opt.sub}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className='pt-2 flex items-center justify-between gap-3'>
        <Button variant='ghost' size='sm' onClick={onSkip} className='text-xs text-muted-foreground cursor-pointer'>
          {t('Later')}
        </Button>
        <Button
          onClick={handleSubmit}
          className='font-semibold gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer px-5'
        >
          <span>{t('Continue to Claim Privileges')}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )
}

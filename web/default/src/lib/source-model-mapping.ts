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

import { useMemo } from 'react'

export interface SourceMappingContext {
  matched: boolean
  sourceId: 'muse_ai' | 'claude_code' | 'glm' | 'kimi' | 'qwen' | 'deepseek' | 'generic'
  badgeLabel: string
  title: string
  description: string
  contextNote: string
  recommendedModel: string
  fallbackModel: string
  preferredTab: 'claude' | 'cursor' | 'curl' | 'python' | 'nodejs'
  originalKeyword?: string
  rawSourceUrl?: string
  rawCampaign?: string
}

const DEFAULT_CONTEXT: SourceMappingContext = {
  matched: false,
  sourceId: 'generic',
  badgeLabel: 'DeepSeek V4 Ultra Fast',
  title: 'DeepSeek V4 High Performance',
  description: 'Ultra-low latency OpenAI-compatible completions for instant agent integration.',
  contextNote: '',
  recommendedModel: 'deepseek-v4-flash',
  fallbackModel: 'deepseek-chat',
  preferredTab: 'curl',
}

/**
 * Extracts and decodes potential attribution and referrer hints from URL, sessionStorage, and localStorage
 */
function extractSourceHints(): {
  campaign: string
  source: string
  redirectUrl: string
  blogUrl: string
  modelParam: string
  referrer: string
} {
  if (typeof window === 'undefined') {
    return { campaign: '', source: '', redirectUrl: '', blogUrl: '', modelParam: '', referrer: '' }
  }

  let campaign = ''
  let source = ''
  let redirectUrl = ''
  let blogUrl = ''
  let modelParam = ''
  let referrer = document.referrer || ''

  try {
    const params = new URLSearchParams(window.location.search)
    campaign = (params.get('utm_campaign') || '').trim().toLowerCase()
    source = (params.get('utm_source') || params.get('channel') || '').trim().toLowerCase()
    redirectUrl = (params.get('redirect') || '').trim().toLowerCase()
    blogUrl = (params.get('from_blog') || '').trim().toLowerCase()
    modelParam = (params.get('model') || '').trim().toLowerCase()

    // Check sessionStorage
    const storedBlog = (sessionStorage.getItem('apivel_from_blog_url') || '').trim().toLowerCase()
    if (storedBlog && !blogUrl) {
      blogUrl = storedBlog
    }

    // Check attribution storage if params not directly on current URL
    if (!campaign || !redirectUrl) {
      const storedLast = window.localStorage.getItem('attr_last_touch')
      const storedFirst = window.localStorage.getItem('attr_first_touch')
      const touchData = storedLast ? JSON.parse(storedLast) : storedFirst ? JSON.parse(storedFirst) : null
      if (touchData) {
        if (!campaign && touchData.campaign) {
          campaign = String(touchData.campaign).trim().toLowerCase()
        }
        if (!source && touchData.source) {
          source = String(touchData.source).trim().toLowerCase()
        }
        if (!redirectUrl && touchData.landing) {
          redirectUrl = String(touchData.landing).trim().toLowerCase()
        }
        if (!referrer && touchData.referrer) {
          referrer = String(touchData.referrer).trim().toLowerCase()
        }
      }
    }
  } catch {
    // Ignore storage parse issues
  }

  return { campaign, source, redirectUrl, blogUrl, modelParam, referrer }
}

/**
 * Detects whether the visitor arrived with a specific model or tutorial intent,
 * and maps third-party or search-targeted models to production-supported models.
 */
export function detectSourceMapping(): SourceMappingContext {
  const hints = extractSourceHints()
  const combined = `${hints.campaign} ${hints.source} ${hints.redirectUrl} ${hints.blogUrl} ${hints.modelParam} ${hints.referrer}`

  // 1. Muse AI / Meta Muse / Qwen Bypass
  // Users coming from Muse AI setup tutorials or search queries searching for Muse AI API
  if (
    combined.includes('muse') ||
    combined.includes('qwen_bypass') ||
    combined.includes('meta-muse')
  ) {
    return {
      matched: true,
      sourceId: 'muse_ai',
      badgeLabel: 'Muse AI Compatible Routing',
      title: 'Muse AI API Compatible Fallback Routing',
      description:
        'Looking for Muse AI API? APIVEL provides high-speed OpenAI-compatible fallback routing. We recommend Qwen 3.8 Max for deep reasoning or DeepSeek V4 Flash for ultra-low latency.',
      contextNote:
        'You do not need a private model named "muse-ai". Call Qwen 3.8 Max or DeepSeek V4 Flash directly with standard OpenAI format for complete drop-in compatibility.',
      recommendedModel: 'qwen3.8-max',
      fallbackModel: 'deepseek-v4-flash',
      preferredTab: 'curl',
      originalKeyword: 'Muse AI',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  // 1b. Space Bunny Alpha Benchmark
  if (
    combined.includes('space-bunny') ||
    combined.includes('space_bunny') ||
    combined.includes('spacebunny') ||
    combined.includes('bunny')
  ) {
    return {
      matched: true,
      sourceId: 'deepseek',
      badgeLabel: 'DeepSeek V4 High Speed',
      title: 'High-Performance Reasoning Benchmark',
      description:
        'Looking for extreme speed? DeepSeek V4 Flash delivers 400+ t/s reasoning with zero cold start at 1/15th of standard cost.',
      contextNote:
        'DeepSeek V4 Flash is pre-selected for your benchmark evaluation with ultra-low latency.',
      recommendedModel: 'deepseek-v4-flash',
      fallbackModel: 'deepseek-chat',
      preferredTab: 'curl',
      originalKeyword: 'Space Bunny Alpha',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  // 2. Claude Code CLI / Cursor Integration
  if (
    combined.includes('claude-code') ||
    combined.includes('claude_code') ||
    combined.includes('cursor') ||
    (combined.includes('claude') && (combined.includes('cli') || combined.includes('terminal')))
  ) {
    return {
      matched: true,
      sourceId: 'claude_code',
      badgeLabel: 'Claude Code CLI Native',
      title: 'Claude Code CLI & Cursor Optimization',
      description:
        'Welcome Claude Code developer! APIVEL provides native Anthropic protocol routing. DeepSeek V4 Flash delivers high intelligence for coding at 1/10th standard cost.',
      contextNote:
        'Zero configuration hassle: simply copy the one-line environment export to run Claude Code with your high-speed APIVEL key.',
      recommendedModel: 'deepseek-v4-flash',
      fallbackModel: 'glm-5.3',
      preferredTab: 'claude',
      originalKeyword: 'Claude Code',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  // 3. GLM 5.3 Series
  if (combined.includes('glm') || combined.includes('zhipu')) {
    return {
      matched: true,
      sourceId: 'glm',
      badgeLabel: 'GLM 5.3 Agentic Intelligence',
      title: 'GLM 5.3 Flagship Agent Routing',
      description:
        'APIVEL routes directly to Zhipu AI GLM 5.3 & GLM 5.3 Flash with premier reasoning, agentic workflow capabilities, and ultra-high concurrency.',
      contextNote:
        'GLM 5.3 is pre-selected and fully configured for your OpenAI-compatible API requests.',
      recommendedModel: 'glm-5.3',
      fallbackModel: 'glm-5.3-flash',
      preferredTab: 'curl',
      originalKeyword: 'GLM 5.3',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  // 4. Kimi K3 / Long Context
  if (combined.includes('kimi') || combined.includes('moonshot') || combined.includes('k3')) {
    return {
      matched: true,
      sourceId: 'kimi',
      badgeLabel: 'Kimi k3 Long Context',
      title: 'Kimi k3 Ultra-Long Context Routing',
      description:
        'Moonshot Kimi k3 architecture optimized for massive context document analysis and deep multi-hop understanding.',
      contextNote:
        'Kimi k3 is ready for your high-context prompt requests with dedicated bandwidth.',
      recommendedModel: 'kimi-k3',
      fallbackModel: 'deepseek-v4-flash',
      preferredTab: 'curl',
      originalKeyword: 'Kimi k3',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  // 5. Qwen 3.8 Series
  if (combined.includes('qwen')) {
    return {
      matched: true,
      sourceId: 'qwen',
      badgeLabel: 'Qwen 3.8 Series',
      title: 'Alibaba Qwen 3.8 High-Performance Intelligence',
      description:
        'Alibaba Qwen 3.8 Max & Flash models deliver world-class math, code reasoning, and multilingual comprehension.',
      contextNote:
        'Qwen 3.8 Max has been pre-selected for your playground and integration tests.',
      recommendedModel: 'qwen3.8-max',
      fallbackModel: 'qwen3.8-flash',
      preferredTab: 'curl',
      originalKeyword: 'Qwen 3.8',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  // 6. DeepSeek Series / Generic
  if (combined.includes('deepseek')) {
    return {
      matched: true,
      sourceId: 'deepseek',
      badgeLabel: 'DeepSeek V4 Ultra Fast',
      title: 'DeepSeek V4 High Speed & Reasoning',
      description:
        'Premier choice for extreme speed and cost efficiency. First-token latency (TTFT) < 300ms, universal OpenAI format.',
      contextNote:
        'DeepSeek V4 Flash is pre-selected for fastest testing.',
      recommendedModel: 'deepseek-v4-flash',
      fallbackModel: 'deepseek-reasoner',
      preferredTab: 'curl',
      originalKeyword: 'DeepSeek V4',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  // 7. General Proprietary Benchmark / OpenRouter / Claude / GPT Comparison Referrals
  if (
    combined.includes('claude') ||
    combined.includes('gpt') ||
    combined.includes('openai') ||
    combined.includes('openrouter') ||
    combined.includes('gemini') ||
    combined.includes('anthropic')
  ) {
    return {
      matched: true,
      sourceId: 'generic',
      badgeLabel: '1/10th Cost Frontier Alternative',
      title: 'Frontier Coding & Reasoning at 1/10th Cost',
      description:
        'Looking for frontier intelligence at sustainable pricing? APIVEL routes to DeepSeek V4 Flash & Qwen 3.8 Max as drop-in OpenAI-compatible alternatives, delivering high benchmark coding performance while cutting token costs by 90%+.',
      contextNote:
        'Call model "deepseek-v4-flash" or "qwen3.8-max" with standard OpenAI format to start testing immediately with your $0.20 trial balance.',
      recommendedModel: 'deepseek-v4-flash',
      fallbackModel: 'qwen3.8-max',
      preferredTab: 'curl',
      originalKeyword: 'Frontier AI Alternative',
      rawSourceUrl: hints.blogUrl || hints.redirectUrl,
      rawCampaign: hints.campaign,
    }
  }

  return DEFAULT_CONTEXT
}

/**
 * React hook to access the current visitor source mapping
 */
export function useSourceMapping(): SourceMappingContext {
  return useMemo(() => detectSourceMapping(), [])
}

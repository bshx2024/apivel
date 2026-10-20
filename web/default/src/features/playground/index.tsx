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
import { ArrowUpRight, ArrowLeft, Zap, Sparkles, Eye, Brain, CheckCircle2, Terminal, Code2, X, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CopyButton } from '@/components/copy-button'
import { Badge } from '@/components/ui/badge'
import { getUserModels, getUserGroups } from './api'
import { PlaygroundChat } from './components/playground-chat'
import { PlaygroundInput } from './components/playground-input'
import { usePlaygroundState, useChatHandler } from './hooks'
import { createUserMessage, createLoadingAssistantMessage } from './lib'
import { useSourceMapping } from '@/lib/source-model-mapping'
import type { Message as MessageType } from './types'

export function Playground() {
  const { t } = useTranslation()
  const sourceContext = useSourceMapping()
  const {
    config,
    parameterEnabled,
    messages,
    models,
    groups,
    updateMessages,
    setModels,
    setGroups,
    updateConfig,
  } = usePlaygroundState()

  const { sendChat, stopGeneration, isGenerating } = useChatHandler({
    config,
    parameterEnabled,
    onMessageUpdate: updateMessages,
  })

  // Edit dialog state
  const [editingMessageKey, setEditingMessageKey] = useState<string | null>(
    null
  )
  const [tutorialUrl, setTutorialUrl] = useState<string | null>(null)

  // Welcome bonus toast and tutorial backlink detection for new visitors
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)

    // Check tutorial backlink
    const fromBlogParam = params.get('from_blog')
    const storedBlogUrl = sessionStorage.getItem('apivel_from_blog_url')
    const blogUrl = fromBlogParam || storedBlogUrl
    if (blogUrl) {
      setTutorialUrl(blogUrl)
    }

    // Check welcome toast
    if (params.get('welcome') === 'true') {
      toast.success(
        t('welcome_toast_title', '🎁 欢迎！免费测试算力已到账，首充专享 +50% 赠额已激活！'),
        {
          description: t(
            'welcome_toast_desc',
            '在下方直接发送测试提示词，体验 400+ t/s 极速推理，或点击上方获取专属 API Key。'
          ),
          duration: 7000,
        }
      )
      // Clean up welcome param from URL without page reload
      params.delete('welcome')
      const newSearch = params.toString()
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '')
      window.history.replaceState({}, '', newUrl)
    }
  }, [t])

  // Load models
  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ['playground-models'],
    queryFn: getUserModels,
  })

  // Load groups
  const { data: groupsData } = useQuery({
    queryKey: ['playground-groups'],
    queryFn: getUserGroups,
  })

  // Update models when data changes
  useEffect(() => {
    if (!modelsData || modelsData.length === 0) return

    setModels(modelsData)

    // Check if url specifies ?model=xxx
    let targetModel: string | null = null
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlModel = urlParams.get('model')
      if (urlModel && !urlModel.toLowerCase().includes('space-bunny')) {
        const found = modelsData.find(
          (m) =>
            m.value.toLowerCase() === urlModel.toLowerCase() ||
            m.label.toLowerCase() === urlModel.toLowerCase()
        )
        if (found) {
          targetModel = found.value
        }
      }
    }

    if (!targetModel) {
      // Check if current configured model is valid
      const isCurrentModelValid = modelsData.some((m) => m.value === config.model)
      if (isCurrentModelValid && config.model && config.model !== 'gpt-4o' && !config.model.includes('space-bunny')) {
        targetModel = config.model
      } else {
        // Priority 1: Matched source campaign/blog recommended model (e.g., qwen3.8-max for Muse AI, deepseek-v4-flash for Claude)
        const matchedModel =
          sourceContext.matched && sourceContext.recommendedModel
            ? modelsData.find((m) =>
                m.value.toLowerCase().includes(sourceContext.recommendedModel.toLowerCase())
              )
            : null

        // Priority 2: deepseek-v4-flash (Fastest & super-cost-effective for onboarding)
        const deepseekFlash = modelsData.find((m) =>
          m.value.toLowerCase().includes('deepseek-v4-flash')
        )
        // Priority 3: any deepseek model
        const anyDeepseek = modelsData.find((m) =>
          m.value.toLowerCase().includes('deepseek')
        )
        targetModel = (matchedModel || deepseekFlash || anyDeepseek || modelsData[0]).value
      }
    }

    if (targetModel && targetModel !== config.model) {
      updateConfig('model', targetModel)
    }
  }, [modelsData, config.model, setModels, updateConfig, sourceContext])

  // Update groups when data changes
  useEffect(() => {
    if (!groupsData) return

    setGroups(groupsData)

    const hasCurrentGroup = groupsData.some((g) => g.value === config.group)
    if (!hasCurrentGroup && groupsData.length > 0) {
      const fallback =
        groupsData.find((g) => g.value === 'default')?.value ??
        groupsData[0].value
      updateConfig('group', fallback)
    }
  }, [groupsData, setGroups, config.group, updateConfig])

  const handleSendMessage = (text: string) => {
    const userMessage = createUserMessage(text)
    const assistantMessage = createLoadingAssistantMessage()

    const newMessages = [...messages, userMessage, assistantMessage]
    updateMessages(newMessages)

    // Send chat request
    sendChat(newMessages)
  }

  const handleCopyMessage = (message: MessageType) => {
    // Copy is handled in MessageActions component
    // eslint-disable-next-line no-console
    console.log('Message copied:', message.key)
  }

  const handleRegenerateMessage = (message: MessageType) => {
    // Find the message index and regenerate from there
    const messageIndex = messages.findIndex((m) => m.key === message.key)
    if (messageIndex === -1) return

    // Remove messages after this one and regenerate
    const messagesUpToHere = messages.slice(0, messageIndex)
    const loadingMessage = createLoadingAssistantMessage()
    const newMessages = [...messagesUpToHere, loadingMessage]

    updateMessages(newMessages)
    sendChat(newMessages)
  }

  const handleEditMessage = useCallback((message: MessageType) => {
    setEditingMessageKey(message.key)
  }, [])

  const handleEditOpenChange = useCallback((open: boolean) => {
    if (!open) setEditingMessageKey(null)
  }, [])

  // Apply edit and optionally re-submit from the edited user message
  const applyEdit = useCallback(
    (newContent: string, submit: boolean) => {
      if (!editingMessageKey) return
      const index = messages.findIndex((m) => m.key === editingMessageKey)
      if (index === -1) return

      const updated = messages.map((m) =>
        m.key === editingMessageKey
          ? { ...m, versions: [{ ...m.versions[0], content: newContent }] }
          : m
      )

      setEditingMessageKey(null)

      if (!submit || updated[index].from !== 'user') {
        updateMessages(updated)
        return
      }

      const toSubmit = [
        ...updated.slice(0, index + 1),
        createLoadingAssistantMessage(),
      ]
      updateMessages(toSubmit)
      sendChat(toSubmit)
    },
    [editingMessageKey, messages, updateMessages, sendChat]
  )

  const handleDeleteMessage = (message: MessageType) => {
    const newMessages = messages.filter((m) => m.key !== message.key)
    updateMessages(newMessages)
  }

  return (
    <div className='relative flex size-full flex-col overflow-hidden'>
      {/* High-Converting Engine & Promo Alert Banner */}
      <div className='w-full max-w-4xl mx-auto px-4 pt-3.5 shrink-0'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/[0.07] via-background to-amber-500/[0.06] text-xs shadow-xs backdrop-blur-md'>
          <div className='flex items-center gap-2 min-w-0 flex-1'>
            <span className='flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/25 font-bold text-xs'>
              ⚡
            </span>
            <div className='min-w-0 text-muted-foreground truncate'>
              <span className='font-bold text-foreground'>
                {sourceContext.matched
                  ? `${t(sourceContext.badgeLabel)} · ${config.model}`
                  : config.model.includes('flash')
                  ? 'DeepSeek / GLM Flash Ultra-Fast Engine'
                  : config.model}
              </span>
              <span className='hidden md:inline'> · 437 t/s · </span>
              <span className='text-amber-600 dark:text-amber-400 font-semibold'>
                {t('🎁 First Deposit +50% Bonus Active (Deposit $5 ➔ Get $7.50)', '🎁 首充享 +50% 算力赠额 (充$5到账$7.5)')}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2 shrink-0 self-end sm:self-auto'>
            {tutorialUrl && (
              <a
                href={tutorialUrl}
                className='inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'
                title={t('Return to previous technical article', '返回刚才阅读的技术文章')}
              >
                <ArrowLeft className='size-3 text-primary' />
                <span>{t('Back to Tutorial', '返回教程')}</span>
              </a>
            )}
            <Link
              to='/keys'
              className='inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'
            >
              <span>{t('API Key', '获取 Key')}</span>
              <ArrowUpRight className='size-3' />
            </Link>
            <Link
              to='/wallet'
              className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-[11px] font-bold text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors'
            >
              <span>{t('Top Up (+50%) →', '充值享 +50% →')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Full-width scroll container: scrolling works even over side whitespace */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        <PlaygroundChat
          messages={messages}
          onCopyMessage={handleCopyMessage}
          onRegenerateMessage={handleRegenerateMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          isGenerating={isGenerating}
          editingKey={editingMessageKey}
          onCancelEdit={handleEditOpenChange}
          onSaveEdit={(newContent) => applyEdit(newContent, false)}
          onSaveEditAndSubmit={(newContent) => applyEdit(newContent, true)}
          onSelectPrompt={handleSendMessage}
          selectedModel={config.model}
        />
      </div>

      {/* Input area: center content and constrain to the same container width */}
      <div className='mx-auto w-full max-w-4xl px-4'>
        {/* 测试完成后的高转化下一步场景引导 */}
        {!isGenerating && messages.some((m) => m.role === 'assistant' && m.content && m.status !== 'streaming') && (
          <div className='mb-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 shadow-xs animate-in fade-in slide-in-from-bottom-2'>
            <div className='flex items-center justify-between gap-2 pb-2 border-b border-emerald-500/20'>
              <div className='flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200'>
                <CheckCircle2 className='size-4 text-emerald-600 dark:text-emerald-400' />
                <span>{t('🎉 极速生成验证成功！立即将此 API 接入您的日常开发工具：', '🎉 极速生成验证成功！立即将此 API 接入您的日常开发工具：')}</span>
              </div>
              <Link to='/keys' className='text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1'>
                <span>{t('管理 API Keys', '管理 API Keys')}</span>
                <ArrowRight className='size-3' />
              </Link>
            </div>
            <div className='mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2'>
              <div className='flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 text-xs shadow-2xs'>
                <div className='flex items-center gap-1.5 min-w-0'>
                  <Terminal className='size-3.5 text-primary shrink-0' />
                  <span className='font-semibold text-primary shrink-0'>Claude Code:</span>
                  <code className='text-[10px] text-muted-foreground truncate'>export ANTHROPIC_BASE_URL=...</code>
                </div>
                <CopyButton
                  value={`export ANTHROPIC_BASE_URL="${typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'https://apivel.com/v1'}" && export ANTHROPIC_API_KEY="sk-YOUR_KEY" && claude`}
                  size='sm'
                  className='h-6 px-1.5 text-[10px]'
                />
              </div>
              <div className='flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 text-xs shadow-2xs'>
                <div className='flex items-center gap-1.5 min-w-0'>
                  <Code2 className='size-3.5 text-blue-600 shrink-0' />
                  <span className='font-semibold text-blue-600 shrink-0'>Cursor:</span>
                  <code className='text-[10px] text-muted-foreground truncate'>{typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'https://apivel.com/v1'}</code>
                </div>
                <CopyButton
                  value={typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'https://apivel.com/v1'}
                  size='sm'
                  className='h-6 px-1.5 text-[10px]'
                />
              </div>
            </div>
          </div>
        )}

        {/* Flash Trio Quick Switcher Pills */}
        <div className='flex items-center gap-1.5 flex-wrap pb-2 text-xs'>
          <span className='text-[11px] font-bold text-muted-foreground shrink-0 flex items-center gap-1'>
            <span>⚡</span>
            <span>{t('Flash Trio Recommendations:', '极速三剑客推荐：')}</span>
          </span>
          <button
            type='button'
            onClick={() => updateConfig('model', 'deepseek-v4-flash')}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border',
              config.model === 'deepseek-v4-flash'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/30'
                : 'bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span>🚀 DeepSeek-V4 Flash</span>
            <span className='text-[9px] opacity-75 font-mono'>$0.10/1M</span>
          </button>
          <button
            type='button'
            onClick={() => updateConfig('model', 'deepseek-v4.1-flash')}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border',
              config.model === 'deepseek-v4.1-flash'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 shadow-xs ring-1 ring-purple-500/30'
                : 'bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span>👁️ DeepSeek-V4.1 Flash</span>
            <span className='text-[9px] opacity-75 font-mono'>Vision</span>
          </button>
          <button
            type='button'
            onClick={() => updateConfig('model', 'glm-5.3-flash')}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border',
              config.model === 'glm-5.3-flash'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                : 'bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span>🧠 GLM-5.3 Flash</span>
            <span className='text-[9px] opacity-75 font-mono'>$0.16/1M</span>
          </button>
        </div>

        <PlaygroundInput
          disabled={isGenerating}
          groups={groups}
          groupValue={config.group}
          isGenerating={isGenerating}
          isModelLoading={isLoadingModels}
          modelValue={config.model}
          models={models}
          onGroupChange={(value) => updateConfig('group', value)}
          onModelChange={(value) => updateConfig('model', value)}
          onStop={stopGeneration}
          onSubmit={handleSendMessage}
        />
      </div>
    </div>
  )
}

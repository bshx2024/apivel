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
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from '@/components/ai-elements/branch'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import { Message, MessageContent } from '@/components/ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Response } from '@/components/ai-elements/response'
import { Shimmer } from '@/components/ai-elements/shimmer'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources'
import { MESSAGE_ROLES } from '../constants'
import { getMessageContentStyles } from '../lib/message-styles'
import { parseThinkTags } from '../lib/message-utils'
import type { Message as MessageType } from '../types'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MessageActions } from './message-actions'
import { MessageError } from './message-error'

const STARTER_PROMPTS = [
  {
    icon: '⚡',
    title: 'Benchmark TTFT & Speed',
    prompt: 'Hi APIVEL! Confirm connection speed and stream output in 10 words.',
    badge: 'Instant Response',
  },
  {
    icon: '💻',
    title: 'Test Coding Capabilities',
    prompt: 'Write a high-performance Python function that computes Fibonacci numbers with memoization and type annotations.',
    badge: 'Code Quality',
  },
  {
    icon: '🧠',
    title: 'Reasoning & Logic Puzzle',
    prompt: 'Solve this puzzle step by step: A farmer needs to cross a river with a wolf, a goat, and a cabbage in a boat that can only hold himself and one item. How does he get all three across safely?',
    badge: 'Deep Reasoning',
  },
  {
    icon: '🌐',
    title: 'Polyglot Translation',
    prompt: 'Translate this into Spanish, French, and Japanese: "Welcome to APIVEL high-speed AI API gateway!"',
    badge: 'Multi-Language',
  },
]

interface PlaygroundChatProps {
  messages: MessageType[]
  onCopyMessage?: (message: MessageType) => void
  onRegenerateMessage?: (message: MessageType) => void
  onEditMessage?: (message: MessageType) => void
  onDeleteMessage?: (message: MessageType) => void
  isGenerating?: boolean
  editingKey?: string | null
  onSaveEdit?: (newContent: string) => void
  onCancelEdit?: (open: boolean) => void
  onSaveEditAndSubmit?: (newContent: string) => void
  onSelectPrompt?: (prompt: string) => void
  selectedModel?: string
}

export function PlaygroundChat({
  messages,
  onCopyMessage,
  onRegenerateMessage,
  onEditMessage,
  onDeleteMessage,
  isGenerating = false,
  editingKey,
  onSaveEdit,
  onCancelEdit,
  onSaveEditAndSubmit,
  onSelectPrompt,
  selectedModel,
}: PlaygroundChatProps) {
  const { t } = useTranslation()
  const [editText, setEditText] = useState('')
  const [originalText, setOriginalText] = useState('')

  useEffect(() => {
    if (!editingKey) return
    const message = messages.find((m) => m.key === editingKey)
    const content = message?.versions?.[0]?.content || ''
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditText(content)

    setOriginalText(content)
  }, [editingKey, messages])

  const isEditing = (key: string) => editingKey === key
  const isEmpty = useMemo(() => !editText.trim(), [editText])
  const isChanged = useMemo(
    () => editText !== originalText,
    [editText, originalText]
  )
  return (
    <Conversation>
      {/* Remove outer padding; apply padding to inner centered container to align with input */}
      <ConversationContent className='p-0'>
        <div className='mx-auto w-full max-w-4xl px-4 py-4'>
          {/* Empty state with instant one-click starter prompts */}
          {messages.length === 0 && (
            <div className='flex flex-col items-center justify-center min-h-[380px] text-center px-4 py-8 space-y-6 animate-in fade-in zoom-in-95 duration-200'>
              <div className='flex flex-col items-center space-y-2 max-w-md'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-xs'>
                  <Sparkles className='h-6 w-6' />
                </div>
                <h3 className='text-base sm:text-lg font-bold text-foreground'>
                  {t('Welcome to APIVEL Playground')}
                </h3>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  {t('Your free trial credits ($0.20) are ready to use. Click any prompt below to test live streaming instantly with')}{' '}
                  <span className='font-semibold text-primary'>{selectedModel || 'DeepSeek-V4 Flash'}</span>:
                </p>
              </div>

              {/* Starter Prompt Chips Grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left'>
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type='button'
                    onClick={() => onSelectPrompt?.(item.prompt)}
                    className='group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-muted/70 hover:border-primary/40 transition-all cursor-pointer shadow-2xs backdrop-blur-xs text-left'
                  >
                    <div>
                      <div className='flex items-center justify-between gap-1.5 mb-1'>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-sm'>{item.icon}</span>
                          <span className='text-xs font-bold text-foreground group-hover:text-primary transition-colors'>
                            {t(item.title)}
                          </span>
                        </div>
                        <span className='text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded'>
                          {t(item.badge)}
                        </span>
                      </div>
                      <p className='text-[11px] text-muted-foreground line-clamp-2 leading-relaxed'>
                        &ldquo;{item.prompt}&rdquo;
                      </p>
                    </div>
                    <div className='flex items-center gap-1 text-[10px] font-semibold text-primary pt-2 opacity-80 group-hover:opacity-100 transition-opacity'>
                      <span>{t('Click to Send Now')}</span>
                      <span>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, messageIndex) => {
            const { versions = [] } = message
            const isLastAssistantMessage =
              messageIndex === messages.length - 1 &&
              message.from === MESSAGE_ROLES.ASSISTANT
            return (
              <Branch defaultBranch={0} key={message.key}>
                <BranchMessages>
                  {versions.map((version, versionIndex) => (
                    <Message
                      className='group flex-row-reverse'
                      from={message.from}
                      key={`${message.key}-${version.id}-${versionIndex}`}
                    >
                      <div className='w-full min-w-0 flex-1 basis-full py-1'>
                        {isEditing(message.key) ? (
                          <div className='space-y-2'>
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className='font-mono text-sm'
                              rows={8}
                            />
                            <div className='flex gap-2'>
                              {/* Save & Submit only makes sense for user messages */}
                              {message.from === MESSAGE_ROLES.USER && (
                                <Button
                                  size='sm'
                                  onClick={() =>
                                    onSaveEditAndSubmit?.(editText)
                                  }
                                  disabled={isEmpty || !isChanged}
                                >
                                  Save & Submit
                                </Button>
                              )}
                              <Button
                                size='sm'
                                onClick={() => onSaveEdit?.(editText)}
                                disabled={isEmpty || !isChanged}
                              >
                                Save
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => onCancelEdit?.(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {(() => {
                              const isAssistant =
                                message.from === MESSAGE_ROLES.ASSISTANT
                              const hasSources = !!message.sources?.length
                              const showReasoning =
                                isAssistant && !!message.reasoning?.content
                              const showLoader =
                                isAssistant &&
                                !message.isReasoningStreaming &&
                                (message.status === 'loading' ||
                                  (message.status === 'streaming' &&
                                    !version.content))
                              const showMessageContent =
                                (message.from === MESSAGE_ROLES.USER ||
                                  !message.isReasoningStreaming) &&
                                !!version.content

                              // Extract visible content (remove <think> tags for assistant messages)
                              const displayContent = isAssistant
                                ? parseThinkTags(version.content).visibleContent
                                : version.content

                              const actions = (
                                <MessageActions
                                  message={message}
                                  onCopy={onCopyMessage}
                                  onRegenerate={onRegenerateMessage}
                                  onEdit={onEditMessage}
                                  onDelete={onDeleteMessage}
                                  isGenerating={isGenerating}
                                  alwaysVisible={isLastAssistantMessage}
                                  className='mt-1'
                                />
                              )

                              return (
                                <>
                                  {/* Sources */}
                                  {hasSources && (
                                    <Sources>
                                      <SourcesTrigger
                                        count={message.sources!.length}
                                      />
                                      <SourcesContent>
                                        {message.sources!.map(
                                          (source, sourceIndex) => (
                                            <Source
                                              href={source.href}
                                              key={`${message.key}-source-${sourceIndex}`}
                                              title={source.title}
                                            />
                                          )
                                        )}
                                      </SourcesContent>
                                    </Sources>
                                  )}

                                  {/* Reasoning */}
                                  {showReasoning && (
                                    <Reasoning
                                      defaultOpen={true}
                                      isStreaming={message.isReasoningStreaming}
                                    >
                                      <ReasoningTrigger />
                                      <ReasoningContent>
                                        {message.reasoning!.content}
                                      </ReasoningContent>
                                    </Reasoning>
                                  )}

                                  {/* Loader */}
                                  {showLoader && (
                                    <div className='flex items-center gap-2 py-2'>
                                      <Loader />
                                      <Shimmer className='text-sm' duration={1}>
                                        Responding...
                                      </Shimmer>
                                    </div>
                                  )}

                                  {/* Error or Content */}
                                  {message.status === 'error' ? (
                                    <>
                                      <MessageError
                                        message={message}
                                        className='mb-2'
                                      />
                                      {actions}
                                    </>
                                  ) : (
                                    showMessageContent && (
                                      <>
                                        <MessageContent
                                          variant='flat'
                                          className={cn(
                                            getMessageContentStyles()
                                          )}
                                        >
                                          <Response>{displayContent}</Response>
                                        </MessageContent>
                                        {isAssistant && message.status === 'complete' && !!displayContent ? (
                                          <div className='flex items-center justify-between flex-wrap gap-2 text-[11px] text-muted-foreground/80 mt-1.5 px-0.5'>
                                            <div className='flex items-center gap-1.5'>
                                              <span className='inline-flex items-center gap-1 font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border text-foreground/80'>
                                                ⚡ ~{Math.max(1, Math.round(displayContent.length * 0.75))} tokens
                                              </span>
                                              <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono'>
                                                ≈ ${((Math.max(1, Math.round(displayContent.length * 0.75)) / 1000000) * 0.14).toFixed(6)}
                                              </span>
                                            </div>
                                            {actions}
                                          </div>
                                        ) : (
                                          actions
                                        )}
                                      </>
                                    )
                                  )}
                                </>
                              )
                            })()}
                          </>
                        )}
                      </div>
                    </Message>
                  ))}
                </BranchMessages>

                {/* Branch selector for multiple versions */}
                {versions.length > 1 && (
                  <BranchSelector className='px-0' from={message.from}>
                    <BranchPrevious />
                    <BranchPage />
                    <BranchNext />
                  </BranchSelector>
                )}
              </Branch>
            )
          })}
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}

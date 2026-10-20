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
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { AnimateInView } from '@/components/animate-in-view'
import {
  Calculator as CalcIcon,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ModelOption {
  name: string
  provider: string
  inputPrice: number // per 1M tokens in USD
  outputPrice: number // per 1M tokens in USD
  latency: string
}

export function Calculator() {
  const { t } = useTranslation()

  // Model Options Data for Calculator (strictly aligned with production channels)
  const models: ModelOption[] = [
    { name: 'deepseek-v4-flash', provider: 'DeepSeek', inputPrice: 0.113, outputPrice: 0.382, latency: '82ms' },
    { name: 'deepseek-v4.1-flash', provider: 'DeepSeek', inputPrice: 0.113, outputPrice: 0.382, latency: '88ms' },
    { name: 'qwen3.8-flash', provider: 'Alibaba Qwen', inputPrice: 0.113, outputPrice: 0.382, latency: '75ms' },
    { name: 'qwen3.8-max', provider: 'Alibaba Qwen', inputPrice: 1.650, outputPrice: 4.950, latency: '120ms' },
    { name: 'glm-5.3-flash', provider: 'Zhipu GLM', inputPrice: 0.100, outputPrice: 0.200, latency: '70ms' },
    { name: 'deepseek-reasoner', provider: 'DeepSeek', inputPrice: 0.550, outputPrice: 2.190, latency: '190ms' },
  ]

  // Calculator State
  const [selectedModelIndex, setSelectedModelIndex] = useState(0)
  const [inputTokens, setInputTokens] = useState(1000)
  const [outputTokens, setOutputTokens] = useState(500)
  const [monthlyRequests, setMonthlyRequests] = useState(50000)
  const [estimatedCost, setEstimatedCost] = useState(0)

  const selectedModel = models[selectedModelIndex]

  // Calculate costs
  useEffect(() => {
    const inputCost = (inputTokens / 1000000) * selectedModel.inputPrice
    const outputCost = (outputTokens / 1000000) * selectedModel.outputPrice
    const singleRequestCost = inputCost + outputCost
    setEstimatedCost(singleRequestCost * monthlyRequests)
  }, [selectedModelIndex, inputTokens, outputTokens, monthlyRequests, selectedModel])

  return (
    <section id="cost-calculator" className="relative z-10 border-t border-border/40 px-6 py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-5xl space-y-12">
        
        {/* Section Header */}
        <AnimateInView className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500 backdrop-blur-sm">
            <Zap className="size-3.5 text-blue-400" />
            {t('Interactive GPT API Price Calculator')}
          </div>
          <h2 className="text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            {t('GPT API Price Calculator & Cost Estimator')}
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mt-1">
              {t('Transparent Pay-Per-Token Pricing')}
            </span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
            {t('Compare GPT API price per token. Input your prompt & completion token volume to calculate real-time savings compared to legacy OpenAI rates.')}
          </p>
        </AnimateInView>

        {/* Cost & Usage Calculator Section */}
        <div className="border border-border/50 bg-card rounded-2xl p-6 md:p-10 space-y-8 max-w-4xl mx-auto shadow-xl">
          
          <div className="flex items-center justify-between border-b border-border/40 pb-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 rounded-xl p-2.5 text-blue-500">
                <CalcIcon className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">{t('Cost & Usage Estimator')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('Compare and plan your token usage for 40+ premier LLM providers')}
                </p>
              </div>
            </div>
          </div>

          <form action="javascript:void(0);" method="POST" onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Model Select Target */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {t('Select Target Model')}
                </label>
                <select
                  name="model"
                  value={selectedModelIndex}
                  onChange={(e) => setSelectedModelIndex(Number(e.target.value))}
                  className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none font-medium"
                >
                  {models.map((m, idx) => (
                    <option key={m.name} value={idx}>
                      {m.provider} — {m.name} (${m.inputPrice.toFixed(2)} / ${m.outputPrice.toFixed(2)} per 1M tokens)
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Tokens Slider */}
              <div className="space-y-2 bg-background/60 p-4 rounded-xl border border-border/30">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>{t('Input/Prompt Tokens (per req)')}</span>
                  <span className="text-blue-500 font-mono text-sm">{inputTokens.toLocaleString()} tokens</span>
                </div>
                <input
                  type="range"
                  name="input_tokens"
                  min="100"
                  max="10000"
                  step="100"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(Number(e.target.value))}
                  className="w-full h-2 bg-border/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Output Tokens Slider */}
              <div className="space-y-2 bg-background/60 p-4 rounded-xl border border-border/30">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>{t('Output/Completion Tokens (per req)')}</span>
                  <span className="text-blue-500 font-mono text-sm">{outputTokens.toLocaleString()} tokens</span>
                </div>
                <input
                  type="range"
                  name="output_tokens"
                  min="50"
                  max="4000"
                  step="50"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(Number(e.target.value))}
                  className="w-full h-2 bg-border/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Monthly Request Volume Slider */}
              <div className="space-y-2 md:col-span-2 bg-background/60 p-4 rounded-xl border border-border/30">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>{t('Monthly Request Volume')}</span>
                  <span className="text-blue-500 font-mono text-sm">{monthlyRequests.toLocaleString()} requests</span>
                </div>
                <input
                  type="range"
                  name="volume"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={monthlyRequests}
                  onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                  className="w-full h-2 bg-border/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

            </div>

              {/* Calculations Result Footer */}
              <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-background/80 p-5 rounded-xl border border-border/30">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t('Estimated Monthly Cost')}</p>
                  <p className="text-3xl font-extrabold text-blue-500 mt-1 font-mono">
                    ${estimatedCost.toFixed(2)} <span className="text-xs font-semibold text-muted-foreground">/mo</span>
                  </p>
                </div>
                <div className="text-right sm:border-l border-border/40 sm:pl-6">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t('Single Request Cost')}</p>
                  <p className="text-base font-bold mt-1 font-mono text-foreground">
                    ${((estimatedCost / monthlyRequests) || 0).toFixed(5)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/80 text-center pt-2 italic">
                *Try it now: with 1,000 input / 500 output tokens × 50K requests/mo, DeepSeek costs ~$11/mo. No account needed to preview pricing.*
              </p>
            </form>

        </div>

        {/* Premium Glassmorphic Signup CTA Banner */}
        <div className="p-6 md:p-8 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-purple-500/10 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl max-w-4xl mx-auto">
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="text-lg font-bold tracking-tight text-foreground">
              {t('Ready to build? Get 100,000 free trial tokens')}
            </h4>
            <p className="text-xs text-muted-foreground max-w-xl">
              {t('Experience automatic failover, load balancing, and unified API keys for 40+ providers. Start routing requests in 2 minutes, no credit card required.')}
            </p>
          </div>
          <div className="shrink-0">
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold px-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
              size="lg"
              render={<Link to='/sign-up' />}
            >
              {t('Get Started for Free')}
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>

      </div>
    </section>
  )
}

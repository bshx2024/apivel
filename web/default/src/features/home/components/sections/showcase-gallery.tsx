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
import { AnimateInView } from '@/components/animate-in-view'
import { Sparkles, Code2, Cpu, MessageSquare, Gauge } from 'lucide-react'

interface OutputItem {
  id: string
  title: string
  category: 'code' | 'benchmark' | 'creative'
  model: string
  latency: string
  tokensPerSec: string
  prompt: string
  outputSnippet: string
  language?: string
}

export function ShowcaseGallery() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<'all' | 'code' | 'benchmark' | 'creative'>('all')

  const items: OutputItem[] = [
    {
      id: 'showcase-1',
      title: t('Ultra-fast React Component Synthesis'),
      category: 'code',
      model: 'DeepSeek-V4.1 Flash',
      latency: '98ms TTFT',
      tokensPerSec: '420 tok/s',
      prompt: t('Write a glassmorphic user profile card component using React and Tailwind CSS.'),
      outputSnippet: `export function ProfileCard({ user }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl">
      <img src={user.avatar} className="size-16 rounded-full border-2 border-blue-500/50" />
      <h3 className="mt-3 text-lg font-bold text-white">{user.name}</h3>
      <p className="text-xs text-slate-400">{user.bio}</p>
    </div>
  )
}`,
      language: 'tsx',
    },
    {
      id: 'showcase-2',
      title: t('Complex Multi-step Reasoning & Logic'),
      category: 'benchmark',
      model: 'Qwen3.8-Max',
      latency: '108ms TTFT',
      tokensPerSec: '130 tok/s',
      prompt: t('Analyze asymptotic complexity of concurrent Lock-Free Queue operations.'),
      outputSnippet: t('**Analysis:** The Lock-Free MPMC Queue uses `CAS` (Compare-And-Swap) atomic primitives. \n- Enqueue Time Complexity: Amortized O(1).\n- Dequeue Time Complexity: Amortized O(1).\n- Memory Reclamation: Requires Hazard Pointers or Epoch-Based Reclamation to safely free nodes without ABA hazards.'),
    },
    {
      id: 'showcase-3',
      title: t('High-throughput Production Python Scraper'),
      category: 'code',
      model: 'GLM-5.2',
      latency: '112ms TTFT',
      tokensPerSec: '120 tok/s',
      prompt: t('Generate an async HTTP client pool with automatic retries and exponential backoff.'),
      outputSnippet: `import httpx, asyncio

async func fetch_with_retry(url: str, retries=3):
    async with httpx.AsyncClient(timeout=5.0) as client:
        for attempt in range(retries):
            try:
                res = await client.get(url)
                return res.json()
            except httpx.HTTPError:
                await asyncio.sleep(2 ** attempt)`,
      language: 'python',
    },
    {
      id: 'showcase-4',
      title: t('Multilingual Contextual Translation'),
      category: 'creative',
      model: 'Doubao-Pro-2.1',
      latency: '85ms TTFT',
      tokensPerSec: '160 tok/s',
      prompt: t('Translate technical API documentation preserving markdown and formatting.'),
      outputSnippet: t('**Original:** "Unified failover routing ensures zero downtime across upstream providers."\n\n**Translation:** "统一故障转移路由机制可确保跨上游 Provider 服务的零停机时间与极高可用性。"'),
    },
  ]

  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(i => i.category === activeCategory)

  return (
    <section className="relative z-10 border-t border-border/40 px-6 py-20 bg-muted/10">
      <div className="mx-auto max-w-5xl space-y-12">
        
        {/* Header */}
        <AnimateInView className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-400 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-purple-400" />
            {t('Chinese Top LLM Models Benchmark & Showcase')}
          </div>
          <h2 className="text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            {t('Explore Real Chinese LLM Outputs & Benchmark Metrics')}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
            {t('Discover real-world AI generation samples processed through APIVEL resilient gateway with ultra-low latency from premier domestic AI models.')}
          </p>

          {/* Filter Categories */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              { id: 'all', label: t('All Showcase'), icon: Sparkles },
              { id: 'code', label: t('Code Generation'), icon: Code2 },
              { id: 'benchmark', label: t('Reasoning & Speed'), icon: Gauge },
              { id: 'creative', label: t('Translation & Copy'), icon: MessageSquare },
            ].map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </AnimateInView>

        {/* Output Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group border border-border/50 bg-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Top Badge Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono">
                      {item.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <Cpu className="size-3" />
                      {item.latency}
                    </span>
                    <span>·</span>
                    <span className="text-purple-400 font-semibold">{item.tokensPerSec}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-blue-500 transition-colors">
                  {item.title}
                </h3>

                {/* Prompt */}
                <div className="bg-muted/40 p-3 rounded-xl border border-border/30 text-xs text-muted-foreground italic">
                  &quot;{item.prompt}&quot;
                </div>

                {/* Output Snippet */}
                <div className="bg-[#0b0f17] text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-white/10 max-h-[180px]">
                  <pre className="whitespace-pre-wrap">{item.outputSnippet}</pre>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Verified SSE Response
                </span>
                <span className="font-mono">HTTP 200 OK</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

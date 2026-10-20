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
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'
import { useStatus } from '@/hooks/use-status'

function extractServerAddress(status: unknown): string {
  const s = status as Record<string, unknown> | null
  const candidate =
    (s?.server_address as string | undefined) ??
    (s?.serverAddress as string | undefined) ??
    (s?.data as Record<string, unknown> | undefined)?.server_address ??
    (s?.data as Record<string, unknown> | undefined)?.serverAddress

  if (candidate && typeof candidate === 'string') {
    return candidate.replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'https://apivel.com'
}

export function FAQ() {
  const { t } = useTranslation()
  const { status } = useStatus()

  const serverAddress = useMemo(() => extractServerAddress(status), [status])
  const baseUrl = useMemo(() => {
    if (serverAddress.endsWith('/v1')) {
      return serverAddress
    }
    return `${serverAddress}/v1`
  }, [serverAddress])

  const faqItems = [
    {
      q: "Is GPT API free to use?",
      a: "While OpenAI's official API does not provide a permanent free tier, APIVEL grants a $0.20 free testing credit upon registration with zero credit card required. Because our flash models cost just $0.10 per million tokens, your free balance covers up to 1,000,000 tokens completely free."
    },
    {
      q: "Is ChatGPT API cheaper than ChatGPT Plus ($20 per month)?",
      a: "Yes. For individual developers and light-to-moderate users, pay-as-you-go GPT API pricing is dramatically cheaper than a flat $20/month subscription. Using APIVEL with clients like Cursor, NextChat, or LibreChat typically costs between $0.60 and $2.00 per month, saving over 90% without message limits."
    },
    {
      q: "How much do 1,000 and 1,000,000 tokens cost on APIVEL?",
      a: "On APIVEL, 1,000 tokens cost between $0.0001 and $0.0003. One million tokens (roughly 750,000 English words) cost between $0.10 and $0.38 for flash models like DeepSeek V4 Flash and Qwen 3.8 Flash, compared to $5.00+ on legacy frontier models."
    },
    {
      q: "How does APIVEL prevent surprise bills and runaway token costs?",
      a: "APIVEL uses a strict 100% prepaid system. There is zero post-paid overdraft risk and no automatic card recharge loops. When your balance reaches zero, requests stop cleanly without generating surprise charges on your bank account."
    },
    {
      q: "Is APIVEL compatible with OpenAI SDKs and tools like Cursor, Claude Code CLI, and VS Code?",
      a: `Yes. APIVEL endpoints are 100% OpenAI-compatible. You can use official OpenAI SDKs, LangChain, LlamaIndex, Cursor, Claude Code CLI, and SillyTavern simply by updating the baseURL to ${baseUrl}.`
    },
    {
      q: "What payment methods are supported on APIVEL?",
      a: "APIVEL supports global payment methods including PayPal, debit cards, and international credit cards. You can test immediately with zero card required, and top up as needed."
    }
  ]

  const useCases = [
    {
      title: "Multi-Model AI Agent Routing",
      desc: "For advanced AI agents, developers often need different models for different steps (e.g., using a cheap model like Gemini Flash for classification, Claude 3.5 Sonnet for code generation, and GPT-4o for final summarization). Integrating these individually is complex and expensive. With APIVEL’s LLM Gateway, you can orchestrate these steps through a single client connection. This drastically reduces code complexity and centralized billing management."
    },
    {
      title: "High-Availability Chatbot Deployments",
      desc: "Customer support chatbots cannot afford downtime. By using APIVEL as your LLM gateway, your chatbot is insulated from individual provider outages. If Anthropic’s API experiences a service disruption, APIVEL can automatically route requests to an equivalent model or trigger a graceful fallback, keeping your customer support active 24/7."
    },
    {
      title: "Global AI SaaS Applications",
      desc: "Building a SaaS that serves users globally requires high performance and compliant billing. APIVEL’s multi-region infrastructure ensures that API calls are routed via the closest node, minimizing network latency. Meanwhile, support for PayPal allows you to scale your development globally, accepting payments from team members regardless of regional credit card limitations."
    },
    {
      title: "Developer Tool Integration (e.g., Cursor, VS Code)",
      desc: "Many developers use IDE extensions like Cursor, VS Code, or Copilot, but prefer to use their own API keys to control costs. APIVEL acts as the perfect high-availability endpoint for local developer tools, providing an OpenAI-compatible endpoint that integrates smoothly into any editor. Simply enter the custom endpoint and your APIVEL key, and you instantly unlock 40+ models directly in your workspace."
    }
  ]

  return (
    <section className="relative z-10 border-t border-border/40 px-6 py-24 md:py-32 bg-muted/5">
      <div className="mx-auto max-w-6xl">
        
        {/* Use Cases Header */}
        <AnimateInView className="mb-16 max-w-2xl">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase">
            {t("Developer Use Cases")}
          </p>
          <h2 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl">
            {t("Real-world applications for our LLM Gateway")}
          </h2>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {t("Discover how engineering teams deploy APIVEL’s LLM Gateway to scale workflows, reduce provider-dependency risk, and leverage high-availability model routing.")}
          </p>
        </AnimateInView>

        {/* Use Cases Grid */}
        <div className="grid gap-8 sm:grid-cols-2 mb-20">
          {useCases.map((uc, i) => (
            <AnimateInView 
              key={uc.title}
              delay={i * 80}
              className="border border-border/20 bg-muted/10 p-6 rounded-2xl space-y-3"
            >
              <h3 className="text-base font-bold tracking-tight">{t(uc.title)}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{t(uc.desc)}</p>
            </AnimateInView>
          ))}
        </div>

        {/* 3-Step Setup Guide */}
        <AnimateInView className="mb-20 border border-blue-500/30 bg-card/60 p-8 rounded-2xl backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">
              {t("Quickstart Setup")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("How to Access Chinese AI APIs in 3 Simple Steps")}
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-3xl">
              {t("Start routing requests to DeepSeek V3/R1, Qwen 2.5/3.8, GLM-5.2, Moonshot Kimi K3, and Doubao with zero KYC requirements in under 2 minutes.")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 pt-2">
            <div className="border border-border/30 bg-muted/20 p-5 rounded-xl space-y-2">
              <span className="text-blue-400 font-extrabold text-sm block">{t("Step 1: Get Your Free API Key")}</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("Register an APIVEL account with zero KYC verification required. No domestic phone number or identity card needed. Receive free trial credits instantly.")}
              </p>
            </div>
            <div className="border border-border/30 bg-muted/20 p-5 rounded-xl space-y-2">
              <span className="text-blue-400 font-extrabold text-sm block">{t("Step 2: Set OpenAI Base URL")}</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("Point your OpenAI SDK, Cursor editor, Claude Code CLI, or Python script to our standard base URL:")}{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground select-all">{baseUrl}</code>
              </p>
            </div>
            <div className="border border-border/30 bg-muted/20 p-5 rounded-xl space-y-2">
              <span className="text-blue-400 font-extrabold text-sm block">{t("Step 3: Call Any Model")}</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("Pass any Chinese AI model ID like deepseek-v4-pro, qwen3.8-max, glm-5.2, or kimi-k3 into your OpenAI API request. Pay seamlessly via PayPal.")}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl font-mono text-xs text-slate-200 border border-slate-800 space-y-2 select-all">
            <p className="text-slate-400">// Python Example: Connect to DeepSeek / Qwen via OpenAI SDK</p>
            <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
{`from openai import OpenAI

client = OpenAI(
    api_key="YOUR_APIVEL_KEY",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[{"role": "user", "content": "Hello Chinese AI API Gateway!"}]
)

print(response.choices[0].message.content)`}
            </pre>
          </div>
        </AnimateInView>

        {/* Direct Providers vs APIVEL Gateway Comparison */}
        <AnimateInView className="mb-24 space-y-6">
          <div className="space-y-2 text-center max-w-3xl mx-auto">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">
              {t("Why Choose APIVEL")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("Why Not Connect to Chinese AI Providers Directly?")}
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t("Integrating official Chinese AI APIs individually presents severe payment friction, identity verification roadblocks, and fragmented SDK maintenance. Here is how APIVEL solves global developer hurdles:")}
            </p>
          </div>

          <div className="overflow-x-auto border border-border/30 rounded-xl bg-card/40 backdrop-blur-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/40 text-foreground font-semibold">
                  <th className="p-4">{t("Comparison Criteria")}</th>
                  <th className="p-4 text-rose-400">{t("Direct Provider Accounts (DeepSeek, Qwen, GLM)")}</th>
                  <th className="p-4 text-emerald-400">{t("APIVEL Chinese AI Gateway")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-muted-foreground">
                <tr className="bg-emerald-500/5">
                  <td className="p-4 font-semibold text-foreground">{t("GPT API Price & Cost Protection")}</td>
                  <td className="p-4">{t("Expensive legacy pricing ($5.00+/1M tokens) or $20/mo subscriptions with soft limits prone to surprise bills.")}</td>
                  <td className="p-4 font-semibold text-emerald-400">{t("From $0.10/1M tokens (90%+ savings). 100% prepaid hard-stop guarantee with zero surprise bills.")}</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">{t("KYC Identity Verification")}</td>
                  <td className="p-4">{t("Requires Chinese mainland (+86) phone number or real-name ID verification.")}</td>
                  <td className="p-4 font-semibold text-emerald-400">{t("Zero KYC. Instant global access with no phone or ID verification.")}</td>
                </tr>
                <tr className="bg-muted/10">
                  <td className="p-4 font-semibold text-foreground">{t("Payment & Top-Up Methods")}</td>
                  <td className="p-4">{t("Restricted to domestic Chinese bank cards, WeChat Pay, or Alipay.")}</td>
                  <td className="p-4 font-semibold text-emerald-400">{t("Supports PayPal and international credit/debit cards globally.")}</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">{t("API Integration & Standard")}</td>
                  <td className="p-4">{t("Fragmented non-standard APIs requiring separate SDKs and endpoints.")}</td>
                  <td className="p-4 font-semibold text-emerald-400">{t("100% OpenAI-compatible endpoint. One API key for 100+ Chinese models.")}</td>
                </tr>
                <tr className="bg-muted/10">
                  <td className="p-4 font-semibold text-foreground">{t("Uptime & Rate Limit Protection")}</td>
                  <td className="p-4">{t("Frequent rate limits and provider outages block production apps.")}</td>
                  <td className="p-4 font-semibold text-emerald-400">{t("Smart multi-channel failover, automatic load balancing, and high availability.")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimateInView>

        {/* FAQ Header */}
        <AnimateInView className="mb-16 max-w-2xl">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase">
            {t("FAQ & Cost Insights")}
          </p>
          <h2 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl">
            {t("Frequently Asked Questions About GPT API Price & Costs")}
          </h2>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {t("Get clear answers on GPT API pricing per token, $20/month ChatGPT Plus cost comparisons, zero-surprise billing guarantees, and integration.")}
          </p>
        </AnimateInView>

        {/* FAQ Content */}
        <div className="grid gap-8 md:grid-cols-2">
          {faqItems.map((item, i) => (
            <AnimateInView 
              key={item.q}
              delay={i * 60}
              className="space-y-2.5"
            >
              <h3 className="text-sm font-bold tracking-tight">{t(item.q)}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{t(item.a)}</p>
            </AnimateInView>
          ))}
        </div>

      </div>
    </section>
  )
}

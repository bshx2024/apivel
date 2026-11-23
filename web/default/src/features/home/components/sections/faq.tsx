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
      q: "How to buy DeepSeek API without a Chinese (+86) phone number?",
      a: "Official DeepSeek accounts require domestic Chinese (+86) SMS verification and local bank cards. APIVEL provides a drop-in OpenAI-compatible gateway that accepts global email registration and instant PayPal billing with zero KYC required."
    },
    {
      q: "How does APIVEL prevent DeepSeek's frequent 503 \"Service Too Busy\" outages?",
      a: "APIVEL employs multi-channel smart failover and load balancing. When an upstream provider experiences traffic congestion or rate limits, requests are automatically re-routed to healthy standby channels in milliseconds."
    },
    {
      q: "How much does DeepSeek API cost compared to OpenAI and Claude?",
      a: "DeepSeek V4 Flash costs $0.113 per 1M input tokens and $0.382 per 1M output tokens on APIVEL, approximately 95% cheaper than OpenAI GPT-4o, while maintaining 100% drop-in OpenAI SDK compatibility."
    },
    {
      q: "Do I need a monthly subscription or can I pay as you go?",
      a: "No monthly subscription is required. APIVEL uses a strict 100% prepaid pay-as-you-go model. You top up exactly what you intend to spend via PayPal or card. Zero surprise bills, no recurring monthly lock-ins, and your credits never expire."
    },
    {
      q: "Is APIVEL compatible with Cursor, Claude Code CLI, and official OpenAI SDKs?",
      a: `Yes. APIVEL endpoints are 100% OpenAI-compatible. You can use official OpenAI SDKs, LangChain, Cursor, Claude Code CLI, and Continue simply by updating the baseURL to ${baseUrl}.`
    },
    {
      q: "Which Chinese AI models are supported on APIVEL?",
      a: "APIVEL strictly serves production-ready Chinese models: DeepSeek Series (deepseek-v4-flash, deepseek-v4.1-flash, deepseek-v4-pro, deepseek-chat, deepseek-v3, deepseek-reasoner), Alibaba Qwen Series (qwen3.8-flash, qwen3.8-max, qwen3.8-omni-flash), Zhipu GLM Series (glm-5.3-flash, glm-5.3, glm-5.3-flashx), Moonshot Kimi (kimi-k3), and ByteDance Doubao Seedance Series."
    }
  ]

  const useCases = [
    {
      title: "Multi-Model AI Agent Routing",
      desc: "For advanced AI agents, developers often need different models for different steps (e.g., using a cheap model like DeepSeek V4 Flash for high-speed triage, Qwen 3.8 Max for complex reasoning, and GLM-5.3 for JSON structured outputs). APIVEL orchestrates these models through a single OpenAI-compatible connection with centralized token accounting."
    },
    {
      title: "High-Availability Chatbot Deployments",
      desc: "Production chatbots cannot afford downtime. By using APIVEL as your LLM gateway, your application is insulated from single-provider 503 traffic surges. If an upstream channel experiences congestion, APIVEL automatically routes requests to a healthy standby channel in milliseconds."
    },
    {
      title: "Global Developer & SaaS Applications",
      desc: "Building a SaaS serving global users requires reliable low latency and frictionless checkout. APIVEL’s multi-region edge proxy minimizes routing hops, while native PayPal support allows international developers (across the US, Europe, India, and worldwide) to purchase API balance without domestic payment barriers."
    },
    {
      title: "IDE & Coding Tool Integration (Cursor, Claude Code, VS Code)",
      desc: "Many software engineers use Cursor, Claude Code, or VS Code extensions, preferring high-intelligence Chinese models like DeepSeek V4 and Qwen 3.8 to dramatically cut coding costs. Simply set the custom baseURL to our OpenAI endpoint and paste your APIVEL key to code seamlessly."
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
